export function debounce(func, delay) {
    let timer
    return function (...args) {
        clearTimeout(timer)
        timer = setTimeout(() => {
            func.apply(this, args)
        }, delay)
    }
}
export function throttle(func, wait) {
    let lastTime = 0
    return function (...args) {
        const now = Date.now()
        if (now - lastTime >= wait) {
            func.apply(this, args)
            lastTime = now
        }
    }
}
export function rafThrottle(func) {
    let scheduled = false
    return function (...args) {
        if (!scheduled) {
            scheduled = true

            requestAnimationFrame(() => {
                func.apply(this, args)
                scheduled = false
            })
        }
    }
}
