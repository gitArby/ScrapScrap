// Easing functions — all take t in [0, 1] and return [0, 1]
// Use G.Ease.* for one-shot curves, G.Tween for animated values over time

G.Ease = {
    // Smooth acceleration
    inQuad: function (t) { return t * t; },
    outQuad: function (t) { return t * (2 - t); },
    inOutQuad: function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },

    // Stronger acceleration
    inCubic: function (t) { return t * t * t; },
    outCubic: function (t) { var u = t - 1; return u * u * u + 1; },
    inOutCubic: function (t) { return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; },

    // Elastic bounce
    outElastic: function (t) {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
    },
    inElastic: function (t) {
        if (t === 0 || t === 1) return t;
        return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    },

    // Overshoot then settle
    outBack: function (t) { var s = 1.70158; var u = t - 1; return u * u * ((s + 1) * u + s) + 1; },
    inBack: function (t) { var s = 1.70158; return t * t * ((s + 1) * t - s); },

    // Bounce at the end
    outBounce: function (t) {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
        if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
        t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
    },

    // Sine wave
    inSine: function (t) { return 1 - Math.cos(t * Math.PI / 2); },
    outSine: function (t) { return Math.sin(t * Math.PI / 2); },
    inOutSine: function (t) { return 0.5 * (1 - Math.cos(Math.PI * t)); },

    // Linear (identity)
    linear: function (t) { return t; }
};

// Interpolate between two values using an easing function
// t: [0, 1], from/to: numbers, easeFn: one of G.Ease.*
G.Ease.lerp = function (from, to, t, easeFn) {
    if (easeFn === undefined) easeFn = G.Ease.linear;
    var et = easeFn(Math.max(0, Math.min(1, t)));
    return from + (to - from) * et;
};

// Tween manager — create and update tweens that auto-advance each frame
G.tweens = [];

// Create a tween: G.Tween(target, prop, from, to, duration, easeFn, onDone)
// duration in frames (60 = 1 sec)
G.Tween = function (target, prop, from, to, duration, easeFn, onDone) {
    var tween = {
        target: target,
        prop: prop,
        from: from,
        to: to,
        duration: duration,
        elapsed: 0,
        easeFn: easeFn || G.Ease.outQuad,
        onDone: onDone || null,
        done: false
    };
    G.tweens.push(tween);
    return tween;
};

G.updateTweens = function () {
    for (var i = G.tweens.length - 1; i >= 0; i--) {
        var tw = G.tweens[i];
        tw.elapsed++;
        var t = Math.min(tw.elapsed / tw.duration, 1);
        tw.target[tw.prop] = G.Ease.lerp(tw.from, tw.to, t, tw.easeFn);
        if (t >= 1) {
            tw.done = true;
            if (tw.onDone) tw.onDone();
            G.tweens.splice(i, 1);
        }
    }
};
