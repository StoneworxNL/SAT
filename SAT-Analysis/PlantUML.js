const { spawn } = require('child_process');
const fs = require('fs');

/**
 * Generates a sequence diagram PNG using PlantUML.
 * @param {string} plantUmlText - The PlantUML source text.
 * @param {string} outputPath - The path to save the PNG file.
 * @param {string} plantUmlJarPath - Path to plantuml.jar.
 * @returns {Promise<string>} - Resolves with the output PNG path.
 */
function generateSequenceDiagram(outputPath, outputfile, plantUmlJarPath) {
    return new Promise((resolve, reject) => {
        // Prepare the PlantUML command
        const args = [
            '-jar',
            plantUmlJarPath,
            outputfile
        ];

        const java = spawn('java', args, { cwd: '.' });

        java.on('error', (err) => {
            fs.unlinkSync(tempFile);
            reject(err);
        });

        java.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`PlantUML exited with code ${code}`));
                return;
            }
            resolve(outputPath);
        });
    });
}

module.exports = { generateSequenceDiagram };