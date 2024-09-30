document.getElementById('cryptoSelector').addEventListener('change', function () {
    const selectedCrypto = this.value;
    const selectedInterval = document.getElementById('intervalSelector').value;
    connectWebSocket(selectedCrypto, selectedInterval);
});

document.getElementById('intervalSelector').addEventListener('change', function () {
    const selectedInterval = this.value;
    const selectedCrypto = document.getElementById('cryptoSelector').value;
    connectWebSocket(selectedCrypto, selectedInterval);
});