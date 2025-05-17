// Utility function to catch async errors and pass them to Express error handler
module.exports = (fn) => {
    return (req, res, next) => {
        // Call the async function and catch any errors, forwarding them to next()
        fn(req, res, next).catch(next);
    };
};
