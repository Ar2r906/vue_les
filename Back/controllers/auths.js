const { user } = require('../models/users.js')
const { auth } = require('../models/auths.js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const secret = process.env.SECRET
const { v4: uuidv4 } = require('uuid')

const ACCESS_LIFETIME = 10;
const REFRESH_LIFETIME = 60 * 60 * 24 *60;

const createToken = (uid, lifetime) => jwt.sign({ uid }, secret, { expiresIn: lifetime })
const createAccess = (uid) => createToken(uid, ACCESS_LIFETIME)
const createRefresh = (uid) => createToken(uid, REFRESH_LIFETIME)

exports.signup = async (req, res) => {
    try {
        const authed = await auth.create({
            email: req.body.email.toLowerCase(),
            role: 'user',
            password: bcrypt.hashSync(req.body.password, 8),
            uid: uuidv4(),
        })
        const createdUser = await user.create({
            uid: authed.uid,
            name: req.body.name,
            likes: 0
        })

        console.log({ message: `Пользователь ${createdUser.uid} зареган` })
        return res.status(201).send({ message: 'registred', uid: createdUser.uid }) 
    } catch (error) {
        return res.status(400).send({message: error.message})
    }
}

exports.signin = async (req, res) => {
    try {
        const user = await auth.findOne({
            where: {
                email: req.body.email.toLowerCase()
            }
        })
        if (!user) return res.status(404).send({ message: 'Пользователь не нйаден!' })
        var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        )
        if (!passwordIsValid) return res.status(414).send({ message: 'Неверный пароль' })
        const token = createAccess(user.uid)
        const token_refresh = createRefresh(user.uid)
        await auth.update({AccessToken: token, RefreshToken: token_refresh},
            {where: {uid: user.uid}})
        console.log({ message: `Пользователь ${user.uid} авторизован` })
        return res.status(200).send({
            uid: user.uid,
            accessToken: token,
            refreshToken: token_refresh,
            email: userEmail,
            name: userName
        })
    } catch (error) {
        return res.status(500).send({ message: error.message })
    }
}

exports.changeAccess = async(req, res) => {
    let token_refresh = req.body.headers['x-refresh-token']
    try {
        const { uid } = jwt.verify(token_refresh, secret)
        const currentUser = await auth.findOne({where: {uid: uid}})
        if(!currentUser) return res.status(404)
        const token = createAccess(currentUser.uid)
        token_refresh = createRefresh(currentUser.uid)
        await auth.update({AccessToken: token, RefreshToken: token_refresh},
            {where: {uid: currentUser.uid}})
        return res.status(200).send({
            uid: currentUser.uid,
            accessToken: token,
            refreshToken: token_refresh
        })
    } catch (error) {
        return res.status(500).send({ message: error.message })
    }
}