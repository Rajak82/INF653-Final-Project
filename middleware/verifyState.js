// Import statesData.json
const data = {
    states: require('../model/statesData.json'),
    setStates: function (data) { this.states = data }
};
// verify the state code
const verifyState = (req, res, next) => {
    const code = req.params.state.toUpperCase(); // converts the state to upper case
    
    const state = data.states.find( st => st.code == code);// search on the state state
    if(!state) {
        return res.status(404).json({ 'message': 'Invalid state abbreviation parameter'});
    }
    res.state = state;
    next();
}

module.exports = verifyState