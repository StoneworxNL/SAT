document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('satForm');
    const resultContainer = document.getElementById('resultContainer');
    const satTypeRadios = document.querySelectorAll('input[name="satType"]');
    const conditionalDiv = document.querySelectorAll('.form-hidden');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(form);
        resultContainer.innerHTML = '<p>Executing SAT program...</p>';

        fetch(`/execute`, {
            method: 'POST',
            body: formData
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

    satTypeRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            conditionalDiv.forEach(div => {
                if (this.value === div.id) {
                    div.className = "form-block";
                } else {
                    div.className = 'form-hidden';
                }
            });
        });
    });
});
