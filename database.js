var mongodb = require('mongodb');
var assert = require('assert');
var mc = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;
var url;

function getItems(){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var items = db.collection('items');
            items.find({}).toArray((err, recs) => {
                if(err)
                {
                    db.close();
                    rej(err);
                    return;
                }
                console.log("Get items:");
                //console.log(recs);
                db.close();
                res(recs);
            });
        });
    });
}

function addItem(name,price,desc,img){
    mc.connect(url, (err, db) => {
        if(err)
        {
            rej(err);
            return;
        }
        var items = db.collection('items');
        items.insertOne({
            name: name,
            price: price,
            desc: desc,
            img: img
        },(err, res) => {
            if(err)
            {
                db.close();
                rej(err);
                return;
            }
            console.log("Inserted item: ", name);
            db.close();
        });
    });
}

function findItems(query){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var items = db.collection('items');
            items.find({name: query}).toArray((err, recs) => {
                if(err)
                {
                    db.close();
                    rej(err);
                    return;
                }
                console.log("Found items for query '", query, "':");
                console.log(recs);
                db.close();
                res(recs);
            });
        });
    });
}

function buyItem(nick, id){
    mc.connect(url, (err, db) => {
        if(err)
        {
            rej(err);
            return;
        }
        var users = db.collection('users');
        users.findOne({nick: nick},(err, user) => {
            if(err || !user)
            {
                db.close();
                rej(err);
                return;
            }
            var orders = db.collection('orders');
            var o_id = new ObjectId(user.order_id);
            orders.updateOne(
                { _id: o_id },
                { $set: {user: nick, status: "incomplete"}, $push: {items_ids: id} },
                { upsert: true }
            );
            console.log(nick, " has bought item with id: ", id);
            db.close();
        });
    });
}

function getOrder(id){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var orders = db.collection('orders');
            var o_id = new ObjectId(id);
            orders.findOne({_id: o_id},(err, order) => {
                if(err || !order)
                {
                    db.close();
                    rej(err);
                    return;
                }
                var items = db.collection('items');
                if(!order.items_ids[0])
                {
                    db.close();
                    res({order: order, items: []});
                }
                var o_ids = [];
                order.items_ids.forEach(id => o_ids.push(new ObjectId(id)));
                items.find({_id: { $in: o_ids}}).toArray((err, result) => {
                    if(err || !result)
                    {
                        db.close();
                        rej(err);
                        return;
                    }
                    db.close();
                    console.log("Order with ID ",id,": ",result);
                    res({order: order, items: result});
                });
            });
        });
    });
}

function addUser(nick, pwd){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var users = db.collection('users');
            users.findOne({nick: nick}, (err, user) => {
                if(user)
                {
                    console.log("User ", user.nick, " already exist");
                    db.close();
                    rej(user);
                    return;
                }
                var orders = db.collection('orders');
                orders.insertOne({user: nick, items_ids: [], status: "incomplete"}, (err, order) => {
                    if(err || !order)
                    {
                        db.close();
                        rej(err);
                        return;
                    }
                    order_id = order.insertedId;
                    users.insertOne({
                        nick: nick,
                        pwd: pwd,
                        order_id: order_id
                    }, (err, result) => {
                        if(err)
                        {
                            db.close();
                            rej(err);
                            return;
                        }
                        db.close();
                        console.log("User ", nick, " with password ", pwd, " has been added");
                        res(result);
                    });
                });
            });
        });
    });
}

function findUser(user){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var users = db.collection('users');
            users.findOne(user, (err, result) => {
                if(err || !result)
                {
                    db.close();
                    rej(err);
                    return;
                }
                console.log("Find user: ", user);
                db.close();
                res(result);
            });
        });
    });
}

function modifyItem(id,name,price,desc,img){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var items = db.collection('items');
            var o_id = new ObjectId(id);
            items.updateOne({_id: o_id},{ $set: {
                name: name,
                price: price,
                desc: desc,
                img: img
            }},(err, result) => {
                if(err)
                {
                    db.close();
                    console.log("Item with id ",id," could not be modified");
                    rej(err);
                    return;
                }
                console.log("Item with id ",id," has been modified");
                db.close();
                res(result);
            });
        });
    });
}

function deleteItem(id){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var items = db.collection('items');
            var o_id = new ObjectId(id);
            items.deleteOne({_id: o_id}, (err, result) => {
                if(err)
                {
                    db.close();
                    console.log("Item with id ",id," could not be deleted");
                    rej(err);
                    return;
                }
                console.log("Item with id ",id," has been deleted");
                db.close();
                res(result);
            });
        });
    });
}

function getItem(id){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var items = db.collection('items');
            var o_id = new ObjectId(id);
            items.findOne({_id: o_id}, (err, item) => {
                if(err || !item)
                {
                    db.close();
                    console.log("Item with id ",id," could not be found");
                    rej(err);
                    return;
                }
                console.log("Get item ",item);
                db.close();
                res(item);
            });
        });
    });
}

function getUsers(){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var users = db.collection('users');
            users.find({}).toArray((err, recs) => {
                if(err)
                {
                    db.close();
                    rej(err);
                    return;
                }
                console.log("Get users:");
                console.log(recs);
                db.close();
                res(recs);
            });
        });
    });
}

function getOrders(){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var orders = db.collection('orders');
            orders.find({}).toArray((err, recs) => {
                if(err)
                {
                    db.close();
                    rej(err);
                    return;
                }
                console.log("Get orders:");
                console.log(recs);
                db.close();
                res(recs);
            });
        });
    });
}

function deleteUser(nick){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var orders = db.collection('orders');
            orders.deleteMany({user: nick}, (err,del) =>
            {
                if(err)
                {
                    db.close();
                    rej(err);
                    return;
                }
                var users = db.collection('users');
                users.deleteOne({nick: nick}, (err, result) => {
                    if(err)
                    {
                        db.close();
                        console.log("User with nick ",nick," could not be deleted");
                        rej(err);
                        return;
                    }
                    console.log("User with nick ",nick," has been deleted");
                    db.close();
                    res(result);
                });
            });
        });
    });
}

function deleteOrder(id){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var order = db.collection('orders');
            var o_id = new ObjectId(id);
            order.deleteOne({_id: o_id}, (err, result) => {
                if(err)
                {
                    db.close();
                    console.log("Order with id ",id," could not be deleted");
                    rej(err);
                    return;
                }
                console.log("Order with id ",id," has been deleted");
                db.close();
                res(result);
            });
        });
    });
}

function getUserOrderId(nick){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var users = db.collection('users');
            users.findOne({nick: nick}, (err, user) => {
                if(err || !user)
                {
                    db.close();
                    console.log("User with nick ",nick," could not be found");
                    rej(err);
                    return;
                }
                console.log("User ",nick," order id is ",user.order_id);
                db.close();
                res(user.order_id);
            });
        });
    });
}

function finalizeOrder(nick,ccn,addr){
    return new Promise(function(res, rej) {
        mc.connect(url, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            var users = db.collection('users');
            users.findOne({nick: nick}, (err, user) => {
                if(err || !user)
                {
                    db.close();
                    console.log("User with nick ",nick," could not be found");
                    rej(err);
                    return;
                }
                var orders = db.collection('orders');
                var o_id = new ObjectId(user.order_id);
                orders.updateOne(
                    { _id: o_id },
                    { $set: {ccn: ccn, addr: addr, status: "complete"}}
                );
                orders.insertOne({user: nick, items_ids: [], status: "incomplete"}, (err, order) => {
                    if(err || !order)
                    {
                        db.close();
                        rej(err);
                        return;
                    }
                    users.updateOne(
                        { nick: nick },
                        { $set: {order_id: order.insertedId}}
                    );
                });
            });
        });
    });
}

exports.connectDB = function(dburl){
    return new Promise(function(res, rej) {
        mc.connect(dburl, (err, db) => {
            if(err)
            {
                rej(err);
                return;
            }
            url = dburl;
            db.close();
            res( {
                getItems: function(){
                    return getItems();
                },
                addItem: function(name,price,desc,img){
                    return addItem(name,price,desc,img);
                },
                findItems: function(query){
                    return findItems(query);
                },
                buyItem: function(user,id){
                    return buyItem(user,id);
                },
                getOrder: function(id){
                    return getOrder(id);
                },
                addUser: function(user,pwd){
                    return addUser(user,pwd);
                },
                findUser: function(user){
                    return findUser(user);
                },
                modifyItem: function(id,name,price,desc,img){
                    return modifyItem(id,name,price,desc,img);
                },
                deleteItem: function(id){
                    return deleteItem(id);
                },
                getItem: function(id){
                    return getItem(id);
                },
                getUsers: function(){
                    return getUsers();
                },
                getOrders: function(){
                    return getOrders();
                },
                deleteUser: function(nick){
                    return deleteUser(nick);
                },
                deleteOrder: function(id){
                    return deleteOrder(id);
                },
                getUserOrderId: function(nick){
                    return getUserOrderId(nick);
                },
                finalizeOrder: function(nick,ccn,addr){
                    return finalizeOrder(nick,ccn,addr);
                }
            });
        });
    });
    
};