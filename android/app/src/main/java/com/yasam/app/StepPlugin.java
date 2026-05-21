package com.yasam.app;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "StepPlugin",
    permissions = {
        @Permission(
            strings = { Manifest.permission.ACTIVITY_RECOGNITION },
            alias = "activity"
        )
    }
)
public class StepPlugin extends Plugin {

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private float lastStepValue = -1;
    private SensorEventListener activeListener;

    @Override
    public void load() {
        Context ctx = getContext();
        sensorManager = (SensorManager) ctx.getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        }

        // Запускаем фоновый слушатель сразу
        startBackgroundListener();
    }

    private void startBackgroundListener() {
        if (sensorManager == null || stepSensor == null) return;
        if (activeListener != null) return;

        activeListener = new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent event) {
                lastStepValue = event.values[0];
                saveSteps((int) lastStepValue);
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };

        sensorManager.registerListener(
            activeListener, 
            stepSensor, 
            SensorManager.SENSOR_DELAY_NORMAL
        );
    }

    private void saveSteps(int stepsFromBoot) {
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(
            "YaSamSteps", Context.MODE_PRIVATE
        );

        String today = new java.text.SimpleDateFormat(
            "yyyy-MM-dd", java.util.Locale.getDefault()
        ).format(new java.util.Date());

        String savedDate = prefs.getString("date", "");
        int baseSteps = prefs.getInt("base", -1);

        if (!today.equals(savedDate) || baseSteps == -1 || stepsFromBoot < baseSteps) {
            prefs.edit()
                .putString("date", today)
                .putInt("base", stepsFromBoot)
                .putInt("today", 0)
                .apply();
        } else {
            int todaySteps = stepsFromBoot - baseSteps;
            prefs.edit()
                .putInt("today", todaySteps)
                .apply();
        }
    }

    @PluginMethod
    public void getSteps(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !hasRequiredPermissions()) {
            requestAllPermissions(call, "onPermResult");
            return;
        }
        returnCurrentSteps(call);
    }

    @PermissionCallback
    private void onPermResult(PluginCall call) {
        if (hasRequiredPermissions()) {
            startBackgroundListener();
            
            // Даём датчику 1 секунду на первое чтение
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                returnCurrentSteps(call);
            }, 1000);
        } else {
            JSObject r = new JSObject();
            r.put("steps", 0);
            r.put("calories", 0);
            r.put("error", "denied");
            call.resolve(r);
        }
    }

    private void returnCurrentSteps(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(
            "YaSamSteps", Context.MODE_PRIVATE
        );

        String today = new java.text.SimpleDateFormat(
            "yyyy-MM-dd", java.util.Locale.getDefault()
        ).format(new java.util.Date());

        String savedDate = prefs.getString("date", "");
        int todaySteps = 0;

        if (today.equals(savedDate)) {
            todaySteps = prefs.getInt("today", 0);
        }

        // Если есть свежее значение от датчика — пересчитываем
        if (lastStepValue >= 0) {
            int stepsFromBoot = (int) lastStepValue;
            int baseSteps = prefs.getInt("base", -1);
            
            if (baseSteps >= 0 && stepsFromBoot >= baseSteps && today.equals(savedDate)) {
                todaySteps = stepsFromBoot - baseSteps;
            }
        }

        int calories = (int) Math.round(todaySteps * 0.04);

        JSObject r = new JSObject();
        r.put("steps", todaySteps);
        r.put("calories", calories);
        r.put("available", stepSensor != null);
        call.resolve(r);
    }
}