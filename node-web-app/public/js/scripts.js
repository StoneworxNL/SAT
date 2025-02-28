document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('satForm');
    const resultContainer = document.getElementById('resultContainer');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(form);
        const selectedSat = formData.get('satType');
        const inputFile = formData.get('inputFile');
        const outputFile = formData.get('outputFile');
        resultContainer.innerHTML = '<p>Executing SAT program...</p>';
        fetch(`/execute`, {
            method: 'POST',
            body: JSON.stringify({
                satType: selectedSat,
                inputFile: inputFile.name,
                outputFile: outputFile
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                
                if (data.success) {
                    resultContainer.innerHTML = `<p>Execution successful! Output file: ${data.outputFile}</p>`;
                } else {
                    resultContainer.innerHTML = `<p>Error: ${data.error}</p>`;
                }
            })
            .catch(error => {
                resultContainer.innerHTML = `<p>Error: ${error.message}</p>`;
            });
    });
});