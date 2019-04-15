# dynamo-delta
Create field updates to dynamodb by providing an original and modified object.  This approach allows
multiple processes to easily work with a single dynamodb record, and in the case where there's collisions
with value updates, an error will be generated.

There are two methods:
* **generateDeltaUpdate:** Provides a method to generate field level update statements for a given object
* **generateDeltaTransaction:** Provides a method to generate transaction statements for a given object

## Quick Start

1. **Install via npm:**
```bash
npm install @moe-tech/dynamo-delta
```

2. **Reference:**

**Typescript:**
```ts
import {generateDeltaUpdate, generateDeltaTransaction} from 'dynamo-delta';
```

**Javascript**
```js
const dynamodelta = require('dynamo-delta');
```

3. **Use:**

**Typescript**
```ts
const dynamodb = new DynamoDB.DocumentClient();

let object = {value: 1, key: 'demo row'};
let original = JSON.parse(JSON.stringify(object));

object.value = 2;
await dynamodb.update(generateDeltaUpdate('Table Name', {key: object.key}, original, object)).promise();
```

**Javascript**
```js
const dynamodb = new DynamoDB.DocumentClient();

let object = {value: 1, key: 'demo row'};
let original = JSON.parse(JSON.stringify(object));

object.value = 2;
await dynamodb.update(dynamodelta.generateDeltaUpdate('Table Name', {key: object.key}, original, object)).promise();
```

##How can I contribute?
dynamo-delta works best when we can all make it better.

### Test

1. Before you share your improvement with the world, use it yourself.
2. For new capabilities, write unit tests
3. Run lint, unit tests and coverage by running the following command
```bash
npm run lt
```

#### Be sure to make your feature globally accessible
When you add capabilities, make sure you're exporting them to the root
index, so the rest of the world can easily access them.
