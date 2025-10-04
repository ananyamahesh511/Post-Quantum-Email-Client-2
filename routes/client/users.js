const { users} = require('../../lib/data');

module.exports = {
	name: 'users',
	async post(req, res) {
		try {
            const { userId, name, email } = req.body;
            if (!userName || !name || !email) {
                return res.status(400).json({ error: "Username and emai required" });
            }

            const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
            if (existingUser) {
                return res.status(400).json({ error: "User already exists" });
            }

            const newUser = new User({ userId, name, email });
            await newUser.save();
            res.status(201).json({ message: "User created successfully", user: newUser });
        } catch (err) {
            console.error("Error creating user:", err);
        }
	},

    async get(req, res) {
        try {
            const users = await User.find();
            res.json(users);
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    }
};