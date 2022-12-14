import connectDB from '../../../utils/connectDB'
import Orders from '../../../models/OrderModel'
import Products from '../../../models/ProductModel'
import {getSession} from "next-auth/react";


connectDB()

export default async (req, res) => {
    switch(req.method){
        case "POST":
            await createOrder(req, res)
            break;
        case "GET":
            await getOrders(req, res)
            break;
    }
}

const getOrders = async (req, res) => {
    try {
        const session = await getSession({ req });
        if (!session){
            return res.status(401).send('شما اجازه نداری');
        }
        let orders;
        if(session.user.isAdmin) {
            orders = await Orders.find().populate("user", "-password").sort({ createdAt: -1 })
        }

        res.json({orders})
    } catch (err) {
        return res.status(500).json({err: err.message})
    }
}

const createOrder = async (req, res) => {
    try {
        const session = await getSession({ req });
        const { cart, total } = req.body

        const newOrder = new Orders({
            user: session.user, cart, total
        })

        cart.filter(item => {
            return sold(item._id, item.quantity, item.inStock, item.sold)
        })

        await newOrder.save()

        res.json({
            msg: 'خرید شما موفقیت آمیز بود',
            newOrder
        })

    } catch (err) {
        return res.status(500).json({err: err.message})
    }
}

const sold = async (id, quantity, oldInStock, oldSold) => {
    await Products.findOneAndUpdate({_id: id}, {
        inStock: oldInStock - quantity,
        sold: quantity + oldSold
    })
}