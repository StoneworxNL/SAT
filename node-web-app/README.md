# node-web-app/node-web-app/README.md

# Node Web App for SAT Programs

This project is a Node.js web application that allows users to execute SAT-L or SAT-C programs and process the result file with SAT-Q. 

## Features

- User-friendly interface to select and execute SAT programs.
- Prompts for all required inputs for SAT-L and SAT-C.
- Processes the output file using SAT-Q.

## Project Structure

```
node-web-app
├── src
│   ├── controllers
│   │   ├── satController.js
│   ├── routes
│   │   ├── index.js
│   ├── views
│   │   ├── index.ejs
│   ├── app.js
│   └── utils
│       ├── satExecutor.js
│       └── satProcessor.js
├── public
│   ├── css
│   │   └── styles.css
│   ├── js
│   │   └── scripts.js
├── package.json
├── .env
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd node-web-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the application:
   ```
   npm start
   ```
2. Open your web browser and go to `http://localhost:3000`.
3. Select either SAT-L or SAT-C, provide the required inputs, and submit the form.
4. The application will execute the selected SAT program and process the results.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.