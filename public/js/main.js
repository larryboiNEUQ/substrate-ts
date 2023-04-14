import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";

const WS_ADDRESS = "ws://127.0.0.1:9944"

// Connect to substrate
const connectSubstrate = async () => {
    console.log("Connecting to Substrate...")
    const wsProvider = new WsProvider(WS_ADDRESS);
    const api = await ApiPromise.create({ provider: wsProvider, types: {} });
    await api.isReady;
    console.log("Connected.");
    return api;
};

// Get Constant
const getConst = async (api) => {
    return api.consts.balances.existentialDeposit.toHuman();
};

// Get balance
const getFreeBalance = async (api, address) => {
    const account = await api.query.system.account(address);
    return account["data"]["free"].toHuman();
};

// Print balance
const printBalance = async (api) => {
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//Bob');
    console.log("Alice's balance is ", await getFreeBalance(api, alice.address));
    console.log("Bob's balance is ", await getFreeBalance(api, bob.address));
};

// Subscribe to the balance of Alice
const subscribeAlice = async (api) => {
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice');
    await api.query.system.account(alice.address, (aliceAcc) => {
        console.log("Subscribe to Alice account");
        const aliceFreeSub = aliceAcc.data.free;
        console.log(`Alice Account (sub): ${aliceFreeSub}`);
    });
};

// Subscribe events
const subscribeEvents = async (api) => {
    // Subscribe to system events via storage
    api.query.system.events((events) => {
        console.log(`\nReceived ${events.length} events:`);

        // Loop through the Vec<EventRecord>
        events.forEach((record) => {
            // Extract the phase, event and the event types
            const { event, phase } = record;
            const types = event.typeDef;

            // Show what we are busy with
            console.log(`\t${event.section}:${event.method}:: (phase=${phase})`);
            console.log(`\t\t${event.meta.documentation}`);

            // Loop through each of the parameters, displaying the type and data
            event.data.forEach((data, index) => {
                console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
            });
        });
    });
};

// Sleep for a while
const sleep = async (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
};

const main = async () => {
    const api = await connectSubstrate();
    const t = await getConst(api)
    console.log("existentialDeposit " + t)
    // const d = await printBalance(api)
    console.log("Connection executed.")
    await subscribeAlice(api)
    await subscribeEvents(api)
    await sleep(600000)
    console.log("Successfuly exit.")
};
main().then(() => {
    console.log("Connection succefully!");
    process.exit(0);
}).catch((err) => {
    console.log("Connection failed: " + err);
    process.exit(1);
});