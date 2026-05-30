const sendChatMessage = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { pesan_user, language = 'id' } = req.body; 

        if (!pesan_user) {
            return res.status(400).json({ message: "The message cannot be empty!" });
        }

        let respons_ai = "";

        try {
            const aiResponse = await axios.post('http://localhost:5001/api/chat', {
                message: pesan_user,
                language: language
            });
            respons_ai = aiResponse.data.reply;
        } catch (aiError) {
            console.error("AI Chat Service Error:", aiError.message);
            respons_ai = "Sorry, LUMEN-bot is currently experiencing network connectivity issues. Please try again later.";
        }

        await HelpModel.saveChatHistory(userId, pesan_user, respons_ai);

        res.status(200).json({
            status: "success",
            message: "Message processed successfully",
            data: {
                pesan_user,
                respons_ai
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to process AI message", error: error.message });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await HelpModel.getChatHistoryByUserId(userId);

        res.status(200).json({
            status: "success",
            data: history
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve chat history", error: error.message });
    }
};

module.exports = { sendChatMessage, getChatHistory };