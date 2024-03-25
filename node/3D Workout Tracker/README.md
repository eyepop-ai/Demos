# 3D Squat Workout Counter 💪

This demo project shows how you can create a unique react-3d interface for a workout tracker. It leverages react-three-fiber, gltfjsx, and zustand for easy 3D scene creation, state managment and EyePop.ai for simple computer vision deployment. 

To get started, enter your EyePop.ai `Pop UUID and Secret Key` into the App.tsx file, in the following code:

```tsx
      // initialize the EyePop SDK
      await initialize({
        popId: '',
        secretKey: ''
      })
```



## Installation

To install and run the project, run the following command after adding your EyePop.ai `PopID` and `Secret Key` to the `App.jsx` file.

```sh
yarn install; yarn dev
```

Dependencies
The project uses several dependencies, including:

- @eyepop.ai/javascript-sdk: The EyePop SDK for tracking user movements.
- @react-three/fiber, @react-three/drei: Libraries for working with Three.js in React.
- zustand: A small, fast state management library.
- tailwindcss: A utility-first CSS framework.
- daisyui: A plugin for Tailwind CSS that provides UI components.

Please refer to the package.json file for a full list of dependencies and devDependencies.
