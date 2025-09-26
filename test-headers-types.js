// Test HeadersInit types to understand the problem
var test1 = {};
var test2 = [['key', 'value']];
var test3 = new Headers();
function currentImplementation(headers) {
    if (!headers)
        return headers;
    // Current problematic return - Record<string,string>
    var sanitized = {};
    return sanitized; // This should cause a type error
}
function correctImplementation(headers) {
    if (!headers)
        return headers;
    // What HeadersInit actually expects
    if (headers instanceof Headers) {
        var sanitized_1 = new Headers();
        headers.forEach(function (value, key) {
            if (value && typeof value === 'string' && value.trim()) {
                sanitized_1.set(key, value.trim());
            }
        });
        return sanitized_1;
    }
    else if (Array.isArray(headers)) {
        var sanitized_2 = [];
        headers.forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (value && typeof value === 'string' && value.trim()) {
                sanitized_2.push([key, value.trim()]);
            }
        });
        return sanitized_2;
    }
    else {
        var sanitized_3 = {};
        Object.entries(headers).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (value && typeof value === 'string' && value.trim()) {
                sanitized_3[key] = value.trim();
            }
        });
        return sanitized_3;
    }
}
