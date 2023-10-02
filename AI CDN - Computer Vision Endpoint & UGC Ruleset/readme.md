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

**Developer Documentation**

---

### Setsource

The `Setsource` operation allows developers to modify the source of a live pipeline. There are various ways to set the source, each addressing different use cases. 

---

#### 1. Setsource (image/video upload)

- **HTTP Method**: `POST`
- **Endpoint**: `/pipelines/{id}/source`
- **Description**: Changes the live pipeline to use the uploaded image or video file as a new source.

**Parameters**:

- `file`: The new source as an image or video file. This needs to be provided in the form data.
- `id`: The ID of the pipeline to change. This is a required path parameter.
- `mode`: The mode to handle concurrent sources. Available values include: `reject`, `preempt`, and `queue`. This is a required query parameter.
- `processing`: The processing mode, either to wait for the result or to fire and forget. Available values are: `sync` (synchronous) and `async` (asynchronous). This is a required query parameter.

**Responses**:

- `200 OK`: The operation was successful.
- `204 No Content`: The operation was successful but there is no content to send in the response.

---

#### 2. Setsource (image/video url)

- **HTTP Method**: `PATCH`
- **Endpoint**: `/pipelines/{id}/source`
- **Description**: Changes the live pipeline to use a new source specified by a URL.

**Parameters**:

- `sourceDef`: Definition of the new source which includes:
  - `sourceType`: Should be set to `"URL"`.
  - `url`: The URL of the image.
  
  Other parameters in the `sourceDef` object such as `sourceId`, `sources`, `streamId`, and `webrtcSessionId` are not relevant for this use case and can be ignored 
  
- `id`: The ID of the pipeline to change. This is a required path parameter.
- `mode`: The mode to handle concurrent sources. Available values include: `reject`, `preempt`, and `queue`. This is a required query parameter.
- `processing`: The processing mode, either to wait for the result or to fire and forget. Available values are: `sync` (synchronous) and `async` (asynchronous). This is a required query parameter.

**Responses**:

- `200 OK`: The operation was successful.
- `204 No Content`: The operation was successful but there is no content to send in the response.

---

#### 3. Setsource (image/video url list)

- **HTTP Method**: `PATCH`
- **Endpoint**: `/pipelines/{id}/source`
- **Description**: Changes the live pipeline to use a new source specified by a list of image URLs synchronously.

**Parameters**:

- `sourceDef`: Definition of the new source which includes:
  - `sourceType`: Should be set to `"LIST"`.
  - `sources`: An array containing the list of image URLs.
  
  Other parameters in the `sourceDef` object such as `sourceId`, `streamId`, and `webrtcSessionId` are not relevant for this use case and can be ignored.

- `id`: The ID of the pipeline to change. This is a required path parameter.
- `mode`: The mode to handle concurrent sources. Available values include: `reject`, `preempt`, and `queue`. This is a required query parameter.
- `processing`: The processing mode, specifically set to `sync` for synchronous processing. This is a required query parameter.

**Responses**:

- `200 OK`: The operation was successful.
- `204 No Content`: The operation was successful but there is no content to send in the response.

---

#### 4. Setsource (streaming video WebRTC)

- **HTTP Method**: `PATCH`
- **Endpoint**: `/pipelines/{id}/source`
- **Description**: Changes the live pipeline to use a new streaming video source via WebRTC.

**Parameters**:

- `sourceDef`: Definition of the new source which includes:
  - `sourceType`: Should be set to `"WEBRTC_DIRECT"`.
  - `webrtcSessionId`: The session ID for the WebRTC streaming video.
  - `streamId`: The session ID for the WebRTC streaming video.
    
  Other parameters in the `sourceDef` object such as `sourceId`, `sources`, `streamId`, and `url` are not relevant for this use case and can be ignored.

- `id`: The ID of the pipeline to change. This is a required path parameter.
- `mode`: The mode to handle concurrent sources. Available values include: `reject`, `preempt`, and `queue`. This is a required query parameter.
- `processing`: The processing mode, either to wait for the result or to fire and forget. Available values are: `sync` (synchronous) and `async

` (asynchronous). This is a required query parameter.

**Responses**:

- `200 OK`: The operation was successful.
- `204 No Content`: The operation was successful but there is no content to send in the response.

---