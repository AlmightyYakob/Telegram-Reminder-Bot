package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	"go.mongodb.org/mongo-driver/bson"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	tb "gopkg.in/tucnak/telebot.v2"
)

var (
	dbClient *mongo.Client
	dbCtx    context.Context
	dbCursor *mongo.Database
	dbCol    *mongo.Collection
	dbCancel context.CancelFunc
)

func initDB(ctx context.Context) {
	dbCtx = ctx

	dbString := fmt.Sprintf("mongodb://%s:%s", os.Getenv("MONGO_URL"), os.Getenv("MONGO_PORT"))
	client, err := mongo.Connect(dbCtx, options.Client().ApplyURI(dbString))
	dbClient = client

	dbCursor = dbClient.Database("telegram")
	dbCol = dbCursor.Collection("reminders")

	if err != nil {
		log.Fatal("Failed to connect to database!")
	}
}

func storeMessageIntoDB(m *tb.Message, wait Wait) primitive.ObjectID {
	storedMessage := tb.StoredMessage{ChatID: m.Chat.ID, MessageID: strconv.Itoa(m.ID)}
	res, err := dbCol.InsertOne(dbCtx, MessageReminder{StoredMessage: storedMessage, Time: wait.futureTimestamp, User: m.Sender})

	if err != nil {
		log.Panic(err)
	}

	id := res.InsertedID.(primitive.ObjectID)
	return id
}

func removeMessageFromDB(id primitive.ObjectID) int64 {
	res, err := dbCol.DeleteMany(dbCtx, bson.M{"_id": id})

	if err != nil {
		log.Panic(err)
	}

	return res.DeletedCount
}
