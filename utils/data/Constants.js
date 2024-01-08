
// a state enum for the people
export const PeopleState = Object.freeze({
    DETECTED: Symbol("detected"),
    TRACKING: Symbol("tracking"),
    LOST: Symbol("lost"),
    REMOVED: Symbol("removed"),
});
