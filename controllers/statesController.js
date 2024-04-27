const State = require('../model/State');


//get all States from json
const data = {
    states: require('../model/statesData.json'),
    setStates: function (data) {this.states = data}
};

//combine the states at the json
async function mergeModels(){
    for (const state in data.states){ 
        //search MongoDB for the entered state to see if they have funfacts
        const fact = await State.findOne({statecode: data.states[state].code}).exec(); // compare each state
        if (fact){
            
            data.states[state].funfacts = fact.funfacts; // combine funfacts with statesData.json
        }
    }
}

// run the merge function
mergeModels();

// Get all states
const getAllStates = async (req,res)=> {
    // check if there is a query
    if (req.query){
        if(req.query.contig == 'true')   // if contig is true, remove two states
        {
            const result = data.states.filter(st => st.code != "AK" && st.code != "HI");
            res.json(result);
            return;
        }
       // if not contig
        else if (req.query.contig == 'false') // display only the two states
        {
            const result = data.states.filter( st => st.code == "AK" || st.code == "HI");     
            res.json(result);
            return;
        }
    }

    res.json(data.states); // otherwise return all states
}

// get one state
const getState = async (req,res)=> {
    // set state code to uppercase
    const code = req.params.state.toUpperCase();
    // search for the state
    const state = data.states.find( st => st.code == code);
    //return the state
    res.json(state);
}

//get state and capital
const getCapital = (req,res)=> {
    // set state code to uppercase
    const code = req.params.state.toUpperCase();
    const state = data.states.find( st => st.code == code);

    res.json({"state": state.state, "capital": state.capital_city}); // Return the capital
}

// get state and nickname
const getNickname = (req,res)=> {
    // set state code to uppercase
    const code = req.params.state.toUpperCase();
    const state = data.states.find( st => st.code == code); //find state code

    res.json({"state": state.state, "nickname": state.nickname}); // return the nickname
}

// get state and population
const getPopulation = (req,res)=> {
    // set state code to uppercase
    const code = req.params.state.toUpperCase();
    const state = data.states.find( st => st.code == code); // find state code

    res.json({"state": state.state, "population": state.population.toLocaleString("en-US")}); // return population
}

// get state admission date
const getAdmission = (req,res)=> {

    // set state code to uppercase
    const code = req.params.state.toUpperCase();
    const state = data.states.find( st => st.code == code); // find state code

    res.json({"state": state.state, "admitted": state.admission_date}); // send date of admittance
}

 // get a random fun fact
const getFunFact = (req,res)=>{
    // set state code to uppercase
    const code = req.params.state.toUpperCase();

    const state = data.states.find( st => st.code == code);
    if(state.funfacts){ // if the state has fun facts
         res.status(201).json({"funfact": state.funfacts[Math.floor((Math.random()*state.funfacts.length))]}); // grab a random one
    } 
    else
    {
        res.status(201).json({"message": `No Fun Facts found for ${state.state}`}); // if not send a message
    }
}

// create fun facts
const createFunFact = async (req,res)=>{
    if(!req?.body?.funfacts){
        return res.status(400).json({"message": "State fun facts value required"});
    }
    if(!Array.isArray(req.body.funfacts)) { // check for array
        return res.status(400).json({'message': "State fun facts value must be an array"});
    }

    // set state code to uppercase
    const code = req.params.state.toUpperCase();

    try {
        // if the funfact cannot be added to an existing group create a new one 
        if(!await State.findOneAndUpdate({statecode: code},{$push: {"funfacts": req.body.funfacts}})){   
            await State.create({ 
                statecode: code,
                funfacts: req.body.funfacts
            });
        } // grab the result of the operation
        const result = await State.findOne({statecode: code}).exec();


        res.status(201).json(result); // send it out
    } catch (err) {console.error(err);}   
    
    mergeModels(); // rebuild the json
}

const updateFunFact = async (req,res)=>{
    if(!req?.body?.index) // check for index
    {
        return res.status(400).json({"message": "State fun fact index value required"});
    }
    if(!req?.body?.funfact){// check for fun fact

        return res.status(400).json({"message": "State fun fact value required"});
    }

    // set state code to uppercase
    const code = req.params.state.toUpperCase();

    const state = await State.findOne({statecode: code}).exec(); // find the state
    const jstate = data.states.find( st => st.code == code);

    let index = req.body.index; // record the index

    if (!jstate.funfacts)
    {
        return res.status(400).json({"message": `No Fun Facts found for ${jstate.state}`});
    }
    
    if(index > state.funfacts.length || index < 1 || !index){ // see if that index exists
        const state = data.states.find( st => st.code == code);
        return res.status(400).json({"message": `No Fun Fact found at that index for ${jstate.state}`});
    }
    index -= 1; // reduce the index to meet the correct spot

    if (req.body.funfact) state.funfacts[index] = req.body.funfact; //if a funfact exists copy the new one over
    
    const result = await state.save(); // save the result

    res.status(201).json(result);

    mergeModels(); // rebuild the json
}   

const deleteFunFact = async(req,res)=>{
    if(!req.body.index) // check for index
    {
        return res.status(400).json({"message": "State fun fact index value required"});
    }

     // get the state code and set it to upper
    const code = req.params.state.toUpperCase();

    const state = await State.findOne({statecode: code}).exec(); //find the state
    const jstate = data.states.find( st => st.code == code);

    let index = req.body.index; // record the index

    if (!jstate.funfacts || index-1 < 0)
    {
        return res.status(400).json({"message": `No Fun Facts found for ${jstate.state}`});
    }
    
    if(index > state.funfacts.length || index < 1 || !index){ // see if that index exists
        const state = data.states.find( st => st.code == code);
        return res.status(400).json({"message": `No Fun Fact found at that index for ${jstate.state}`});
    }
    index -= 1; // reduce the index to meet the correct spot

    state.funfacts.splice(index, 1); // if it does slice off the fact
    
    const result = await state.save(); // save the result

    res.status(201).json(result);

    mergeModels(); // rebuild the json
}

module.exports={getAllStates, getState, getNickname, getPopulation, getCapital, getAdmission, getFunFact, createFunFact, updateFunFact, deleteFunFact};