**Developer Documentation**

---

### Class: Rules

The `Rules` class has been specifically crafted for processing the outputs of EyePop.ai's computer vision system. It provides functionalities to construct semantic rules, helping in the identification and extraction of specific features and attributes from photos and videos.

#### Methods:

---

**1. `FindObjects(label, objects)`**
- **Purpose**: Filters the provided list of objects based on the specified class label.
- **Parameters**:
  - `label`: String representing the class label of the desired object.
  - `objects`: Array of objects.
- **Returns**: Array of objects that match the specified class label.

---

**2. `Biggest(label, objects)`**
- **Purpose**: Identifies the object with the largest bounding box area for a specific class label.
- **Parameters**:
  - `label`: String representing the class label of the object to compare.
  - `objects`: Array of objects.
- **Returns**: Single object with the largest area.

---

**3. `Area(object, source_width, source_height)`**
- **Purpose**: Computes the relative area of an object to the source's dimensions.
- **Parameters**:
  - `object`: Object whose area needs to be determined.
  - `source_width`: Width of the source.
  - `source_height`: Height of the source.
- **Returns**: Relative area (fraction) of the object with respect to the source dimensions.

---

**4. `Between(x, min, max)`**
- **Purpose**: Checks if a given value lies between a specified range.
- **Parameters**:
  - `x`: The value to be checked.
  - `min`: Minimum value of the range.
  - `max`: Maximum value of the range.
- **Returns**: Boolean value indicating whether `x` lies between `min` and `max`.

---

**5. `Amount(label, objects)`**
- **Purpose**: Counts the number of objects that match a specific class label.
- **Parameters**:
  - `label`: String representing the class label.
  - `objects`: Array of objects.
- **Returns**: Integer count of objects that match the specified label.

---

**6. `PosePoint(label, personObject)`**
- **Purpose**: Determines if a person object contains a specific pose point label.
- **Parameters**:
  - `label`: Pose point label.
  - `personObject`: Object containing pose information.
- **Returns**: Boolean indicating presence of the pose point label.
["left shoulder", "right shoulder","left hip","right hip","left elbow","left wrist","left knee","left ankle","right elbow","right wrist","right knee","right ankle"]


---

**7. `Emotion(emotionLabel, personObject)`**
- **Purpose**: Checks the inferred emotion on a person's face.
- **Parameters**:
  - `emotionLabel`: The desired emotion label.
  - `personObject`: Object containing facial information.
- **Returns**: Boolean indicating the presence of the specified emotion.

---

**8. `Gender(genderLabel, personObject)`**
- **Purpose**: Checks the inferred gender label of a person based on the identified facial features.
- **Parameters**:
  - `genderLabel`: Gender label to check.
  - `personObject`: Person Object containing facial information.
- **Returns**: Boolean indicating if the identified gender label matches the specified personObject.

---

**9. `Position(object1, direction, object2)`**
- **Purpose**: Compares the relative positions of two objects based on the specified direction.
- **Parameters**:
  - `object1`: First object.
  - `direction`: String representing the desired direction (`above`, `below`, `left`, `right`).
  - `object2`: Second object.
- **Returns**: Boolean indicating the relative position of `object1` with respect to `object2` based on the given direction.

---

**10. `Check(resultSet, rules, rulesState)`**
- **Purpose**: Evaluates a set of conditions on the provided resultSet and tracks the state of rule evaluations.
- **Parameters**:
  - `resultSet`: Data to be evaluated.
  - `rules`: Array containing conditions to evaluate on the `resultSet`.
  - `rulesState`: Object to track the state of rule evaluations.
- **Returns**: Array of results for each rule evaluation.

---

This class forms the bedrock for a structured understanding of computer vision results. Proper utilization ensures the extraction of meaningful and relevant data, thereby enhancing the effectiveness and accuracy of the overall system.