import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// This is where you can define more workout routines
const workoutList = [
    {
        id: 1,
        name: 'Squats',
        rules: " Biggest Person left hip below Biggest Person left knee " + "\r\n" +
            " Biggest Person right hip below Biggest Person right knee " + "\r\n" +
            " Biggest Person left hip above Biggest Person left knee " + "\r\n" +
            " Biggest Person right hip above Biggest Person right knee "
    },
]

const defaultWorkout = 0;


interface SceneStoreState
{
    repCount: number;
    repsPerSet: number;
    currentSet: number;
    totalSets: number;
    personBoundsScalar: number;
    workoutRules: string;
    activeWorkoutIndex: number;
    workoutList: { id: number, name: string, rules: string }[];
}

interface SceneStoreActions
{
    incrementRep: () => void;
    setRepCount: (value: number) => void;
    setRepsPerSet: (value: number) => void;
    setCurrentSet: (value: number) => void;
    setTotalSets: (value: number) => void;
    setWorkoutRoutine: (value: string) => void;
    setWorkout: (index: number) => void;
    setPersonBoundsScalar: (value: number) => void;
    reset: () => void;
}

type SceneStore = SceneStoreState & SceneStoreActions;

const store = (set): SceneStore => ({
    repCount: 0,
    repsPerSet: 10,
    currentSet: 0,
    totalSets: 3,
    personBoundsScalar: .1,
    workoutRules: workoutList[ defaultWorkout ].rules,
    activeWorkoutIndex: defaultWorkout,
    workoutList: workoutList,
    incrementRep: () =>
    {
        set((state) =>
        {
            let newRepCount = state.repCount + 1;

            if (newRepCount > state.repsPerSet)
            {
                // You can add additional logic here if needed
                set({ currentSet: state.currentSet + 1 })
                newRepCount = 1;
            }

            return ({ repCount: newRepCount });
        });
    },
    setRepCount: (value) => set({ repCount: value }),
    setRepsPerSet: (value) => set({ repsPerSet: value }),
    setCurrentSet: (value) => set({ currentSet: value }),
    setTotalSets: (value) => set({ totalSets: value }),
    setWorkoutRoutine: (value) => set({ workoutRules: value }),
    reset: () =>
    {
        set({
            repCount: 0, currentSet: 0, totalSets: 3, repsPerSet: 10, workoutRules: workoutList[ defaultWorkout ].rules,
        })
    },
    setWorkout: (index) => set({ activeWorkoutIndex: index, workoutRules: workoutList[ index ].rules }),
    setPersonBoundsScalar: (value) => set({ personBoundsScalar: value })
});

export const useSceneStore = create(devtools(persist(store, { key: 'scene-store-workout' })));
