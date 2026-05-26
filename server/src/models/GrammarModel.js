const db = require('../config/database');

const GrammarModel = {
    saveHistory: async (userId, originalInput, correctedOutput, errorDetails) => {
        const query = `
            INSERT INTO grammar_correction_histories 
            (user_id, original_input, corrected_output, error_details) 
            VALUES (?, ?, ?, ?)
        `;
        const stringifiedDetails = typeof errorDetails === 'object' 
            ? JSON.stringify(errorDetails) 
            : errorDetails;

        const [result] = await db.query(query, [userId, originalInput, correctedOutput, stringifiedDetails]);
        return result.insertId;
    }
};

module.exports = GrammarModel;