import { createChart } from 'lightweight-charts';

// Create chart options
const chartOptions = {
    layout: {
        textColor: 'black',
        background: { type: 'solid', color: 'white' },
    },
    width: 600,
    height: 400,
    timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
            const date = new Date(time * 1000); // Convert from seconds to milliseconds
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }
};

// Create the chart and candlestick series
const chart = createChart(document.getElementById('container'), chartOptions);
const candlestickSeries = chart.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
});

let ws;
const candleDataHistory = {}; // Object to hold historical data for each coin
const maxDataPoints = 200; // Maximum number of candlestick data points to keep

// Load historical data from localStorage
function loadHistoryFromLocalStorage(cryptoPair) {
    const storedData = localStorage.getItem(cryptoPair);
    if (storedData) {
        return JSON.parse(storedData);
    }
    return [];
}

// Save historical data to localStorage
function saveHistoryToLocalStorage(cryptoPair, data) {
    localStorage.setItem(cryptoPair, JSON.stringify(data));
}

// Function to connect to Binance WebSocket for candlesticks
function connectWebSocket(cryptoPair, interval) {
    if (ws) {
        ws.close(); // Close the previous connection if it exists
    }

    // Create WebSocket URL for the selected cryptocurrency and interval
    const binanceSocket = `wss://stream.binance.com:9443/ws/${cryptoPair}@kline_${interval}`;

    ws = new WebSocket(binanceSocket);

    // Handle WebSocket connection
    ws.onopen = function () {
        console.log(`Connected to Binance WebSocket for ${cryptoPair} at ${interval} interval`);
    };

    // Handle WebSocket messages
    ws.onmessage = function (event) {
        console.log(event.data)
        const messageObject = JSON.parse(event.data);
        

        // Check if the candlestick is closed (k.x === true indicates a closed candlestick)
        if (messageObject.k && messageObject.k.x) {
            const candleData = {
                time: messageObject.k.t / 1000, // Convert milliseconds to seconds for the chart
                open: parseFloat(messageObject.k.o),
                high: parseFloat(messageObject.k.h),
                low: parseFloat(messageObject.k.l),
                close: parseFloat(messageObject.k.c),
            };

            // Store candle data for the current cryptocurrency
            if (!candleDataHistory[cryptoPair]) {
                candleDataHistory[cryptoPair] = loadHistoryFromLocalStorage(cryptoPair);
            }
            candleDataHistory[cryptoPair].push(candleData);

            // Keep only the most recent data points to avoid performance issues
            if (candleDataHistory[cryptoPair].length > maxDataPoints) {
                candleDataHistory[cryptoPair].shift(); // Remove the oldest data point
            }

            // Update the candlestick series with the new candle
            candlestickSeries.update(candleData);
            saveHistoryToLocalStorage(cryptoPair, candleDataHistory[cryptoPair]); // Save to localStorage
        }
    };

    // Handle WebSocket errors
    ws.onerror = function (error) {
        console.error('WebSocket error: ', error);
    };

    // Handle WebSocket closure
    ws.onclose = function () {
        console.log(`WebSocket for ${cryptoPair} at ${interval} interval closed`);
    };

    // Load historical data if available
    candlestickSeries.setData(candleDataHistory[cryptoPair] || loadHistoryFromLocalStorage(cryptoPair));
}

// Initial connection with ETH/USDT and 1-minute interval
connectWebSocket('ethusdt', '1m');

// Event listener for the cryptocurrency selector
document.getElementById('cryptoSelector').addEventListener('change', function () {
    const selectedCrypto = this.value;
    const selectedInterval = document.getElementById('intervalSelector').value;
    connectWebSocket(selectedCrypto, selectedInterval);
});

// Event listener for the interval selector
document.getElementById('intervalSelector').addEventListener('change', function () {
    const selectedInterval = this.value;
    const selectedCrypto = document.getElementById('cryptoSelector').value;
    connectWebSocket(selectedCrypto, selectedInterval);
});
