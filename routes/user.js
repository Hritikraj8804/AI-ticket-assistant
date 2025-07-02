import express from "express"
import { login, signup, updateUser} from "../controllers/user.js"
import {authenticate} from "../middlewares/auth.js";


const router = express.Router();

router.post("/update-user", authenticate, update);
router.get("/users", authenticate,getUsers);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default reoter;