const mongoose = require('mongoose');
const User = require('../../models/User');
const ChatRoom = require('../../models/Chatroom').Chatroom;

module.exports = {
	name: 'chatrooms',
	async post(req, res) {
		try {
            const { person1, person2 } = req.body;
            async function findOrCreateUser(person) {
                const user = await User.findOne({ email: person.email });
                if (!user) {
                    user = new User({
                        userId: new mongoose.Types.ObjectId().toString(),
                        name: person.name || person.email.split("@")[0],
                        email: person.email,
                        phone: person.phone,
                    });
                    await user.save();
                }
                return user;
            }
            const user1 = await findOrCreateUser(person1);
            const user2 = await findOrCreateUser(person2);

            //checking if any chatroom between these two users exists
            let room = await ChatRoom.findOne ({
                users: { $all: [user1.userId, user2.userId] }
            });

            if (!room) {
                room = new ChatRoom ({
                    users: [user1.userId, user2.userId],
                    messages: [],
                });
                await room.save();
            }
            res.json({ roomId: room._id, users: room.users });
	    }
        catch (error) {
            console.log(error);
        }
	},
};