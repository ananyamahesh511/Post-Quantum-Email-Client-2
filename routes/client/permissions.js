const User = require ('../../models/User');

module.exports = {
    name: 'permissions',
    async get (req, res) {
        try{
            const {userId} = req.query;
            if (!userId) {
                return res.status(400).json({error: "userId is required"});
            }

            const user = User.findOne({userId: userId});
            if (!user) {
                return res.status(400).json({error: "User not found!"}); 
            }

            res.json({
                isExports: user.isExports,
                isScreenshots: user.isScreenshots,
            });
        } catch (err) {
            console.error("Error fetching permissions:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async post(req, res) {
        try{
            // const {userId} = req.params;
            const {field, userId, status} = req.body;

            if (!["isExports", "isScreenshots"].includes(field)) {
                return res.status(400).json({ error: "Invalid field to toggle" });
            }

            const user = await User.findOne({ userId });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            user[field] = status;
            await user.save();

            res.json({
                isExports: user.isExports,
                isScreenshots: user.isScreenshots
            });

        } catch (error) {
            console.error("Error toggling permissions:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}