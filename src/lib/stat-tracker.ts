let calculationCount = 0;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
const listeners: Set<(count: number) => void> = new Set();

export const getPendingCount = () => calculationCount;

export const subscribeToPendingCount = (callback: (count: number) => void) => {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
};

const notifyListeners = () => {
    listeners.forEach((cb) => cb(calculationCount));
};

const sendBatch = async () => {
    if (calculationCount === 0) return;

    const countToSync = calculationCount;
    calculationCount = 0;
    notifyListeners();

    try {
        const res = await fetch("/api/stats", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ stat: "calculated", count: countToSync }),
            keepalive: true,
        });
        if (!res.ok) {
            throw new Error("Failed to send stats");
        }
    } catch (err) {
        // In case of failure, add back to the count
        calculationCount += countToSync;
        notifyListeners();
    }
};

export const recordCalculation = () => {
    calculationCount++;
    notifyListeners();

    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    // Send batch after 5 seconds of inactivity
    timeoutId = setTimeout(() => {
        timeoutId = null;
        sendBatch();
    }, 5000);
};

// Ensure stats are sent when the user leaves the page
if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
        if (calculationCount > 0) {
            sendBatch();
        }
    });
}
