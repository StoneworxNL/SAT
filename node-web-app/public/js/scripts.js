document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('satForm');
    const resultContainer = document.getElementById('resultContainer');
    const satTypeRadios = document.querySelectorAll('input[name="satType"]');
    const conditionalDiv = document.querySelectorAll('.form-hidden');
    const doDiffCheckboxes = document.querySelectorAll('input[name="doDiff"]');

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
                    resultContainer.innerHTML = `<p>Execution successful! Output file(s):<br/> ${data.outputFile}</p>`;
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
                if (this.name == div.getAttribute('group')) {
                    if (this.value === div.id) {
                        div.className = "form-block";
                    } else {
                        div.className = 'form-hidden';
                    }
                }
            });
        });
    });

    doDiffCheckboxes.forEach(cb => {
        cb.addEventListener('change', function () {
            conditionalDiv.forEach(div => {
                if (this.name == div.getAttribute('group')) {
                    if (this.value === div.id && this.checked) {
                        div.className = "";
                    } else {
                        div.className = 'form-hidden';
                    }
                }
            });
        });
    });
});
