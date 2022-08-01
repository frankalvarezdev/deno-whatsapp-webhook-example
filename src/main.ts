import { opine, json } from 'https://deno.land/x/opine@2.2.0/mod.ts'
import { config } from 'https://deno.land/x/dotenv@v3.2.0/mod.ts'

// set up http server
const app = opine()

// get environment variables
const env = {
	...config(),
	...Deno.env.toObject()
}

// Access token for your app
// edit in .env file
const token = env.WHATSAPP_TOKEN

// body parser
app.use(json())

app.post('/webhook', (req, res) => {
	// Parse the request body from the POST
	const body = req.body

	// Check the Incoming webhook message
	console.log(JSON.stringify(body, null, 2))

	// info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
	if (req.body.object) {
		if (
			req.body.entry &&
			req.body.entry[0].changes &&
			req.body.entry[0].changes[0] &&
			req.body.entry[0].changes[0].value.messages &&
			req.body.entry[0].changes[0].value.messages[0]
		) {
			const phoneNumberId = req.body.entry[0].changes[0].value.metadata.phone_number_id
			const from = req.body.entry[0].changes[0].value.messages[0].from // extract the phone number from the webhook payload
			const msBody = req.body.entry[0].changes[0].value.messages[0].text.body // extract the message text from the webhook payload

			// hacer lo mismo de axios pero con fetch
			fetch(`https://graph.facebook.com/v12.0/${phoneNumberId}/messages?access_token=${token}`, {
				method: 'POST', // Required, HTTP method, a string, e.g. POST, GET
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messaging_product: 'whatsapp',
					to: from,
					text: { body: 'Ack: ' + msBody }
				})
			})
		}
		res.sendStatus(200)
	} else {
		// Return a '404 Not Found' if event is not from a WhatsApp API
		res.sendStatus(404)
	}
})

app.get('/webhook', (req, res) => {
	const verifyToken = env.VERIFY_TOKEN

	const mode = req.query['hub.mode']
	const token = req.query['hub.verify_token']
	const challenge = req.query['hub.challenge']

	console.log(mode, token, challenge)

	if (mode && token) {
		// Check the mode and token sent are correct
		if (mode === 'subscribe' && token === verifyToken) {
			// Respond with 200 OK and challenge token from the request
			console.log('WEBHOOK VERIFIED! 🥳')
			res.send(challenge)
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403)
		}
	}
})

// Sets server port and logs message on success
const serverPort = parseInt(env.PORT) || 1337
app.listen(
	serverPort,
	() => console.log(`server has started on http://localhost:${serverPort} 🚀`),
)