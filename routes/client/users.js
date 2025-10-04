const User = require('../../models/User');
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 5 });

module.exports = {
	name: 'users',
	async post(req, res) {
		try {
            const userId = uid.rnd();

            const { name, email, phone } = req.body;
            if (!name || !email || !phone) {
                return res.status(400).json({ error: "Name and email required" });
            }

            const existingUser = await User.findOne({ $or: [ { email }, { phone }] });
            if (existingUser) {
                return res.status(400).json({ error: "User already exists" });
            }

            const newUser = new User({ userId, name, email, phone });
            await newUser.save();
            res.status(201).json({ message: "User created successfully", user: newUser });
        } catch (err) {
            console.error("Error creating user:", err);
            res.status(500).json({ error: "Internal server error" });
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