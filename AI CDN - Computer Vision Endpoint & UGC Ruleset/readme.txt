Abilty to clone a git hub repo
Ability to add pop id, and oauth into code
Ability to run locally
Demo	
1) First we get a simple Upload image page working
Drag and drop an image OR Choose from phone
Image is uploaded to a CDN bucket (owned by EyePop)
Explore the REST API POST with architecture diagram
On upload, return side by side results:
Original Photo in CDN
Photo annotated cleanly by EyePop 
Json Results
Ruleset AREA
If no rules in ruleset then blank
2) Second we get the Ruleset builder working
Example Rule:
“Must have at least one person”
User has ability to edit a ruleset array
Rule logic, Severity, Message
“Amount(Person) > 1”, “Warning”, “This photo would be better with a person!”
3) More advanced rules
Example Rules:
“Must have a dog”
“Amount(dog) > 1”, “Warning”, “This photo would be better with a doggo!”
“Must have a person raising one hand”
“PositionY(Person.right_hand) > PositionY(Person.head) or PositionY(Person.left_hand) > PositionY(Person.head)”, “Warning”, “You didn’t raise your hand!” 
4) Free time
What crazy rules can you come up with?
24 hour challenge

Rules

Boolean statements?

(person.)
