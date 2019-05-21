import { generateDeltaUpdate, generateDeltaTransaction } from ".";

describe('generateDeltaTransaction', () => {
    test('Objects are same', () => {
        const result = generateDeltaTransaction('test', { Key: 'test'}, generateTestData(), generateTestData());
        expect(result).toBeNull();
    });
});

describe('generateDeltaUpdate', () => {
    test('Objects are same', () => {
        const result = generateDeltaUpdate('test', { Key: 'test'}, generateTestData(), generateTestData());
        expect(result).toBeNull();
    });

    test('Number has difference', () => {
        const after = generateTestData();
        after.number = 2;
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #number = :0');
        expect(result.ConditionExpression).toBe('#number = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(2);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(1);
    });

    test('String has difference', () => {
        const after = generateTestData();
        after.string = 'This is a new string';
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #string = :0');
        expect(result.ConditionExpression).toBe('#string = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.string);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.string);
    });

    test('Boolean has difference', () => {
        const after = generateTestData();
        after.bool = false;
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #bool = :0');
        expect(result.ConditionExpression).toBe('#bool = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.bool);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.bool);
    });

    test('Buffer has difference', () => {
        const after = generateTestData();
        after.buffer = new Buffer('Test');
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #buffer = :0');
        expect(result.ConditionExpression).toBe('#buffer = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.buffer);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.buffer);
    });

    test('String Array has difference', () => {
        const after = generateTestData();
        after.arrayString[0] = 'test update';
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #arrayString[0] = :0');
        expect(result.ConditionExpression).toBe('#arrayString[0] = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.arrayString[0]);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.arrayString[0]);
    });

    test('Number Array has difference', () => {
        const after = generateTestData();
        after.arrayNumbers[0] = 2;
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #arrayNumbers[0] = :0');
        expect(result.ConditionExpression).toBe('#arrayNumbers[0] = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.arrayNumbers[0]);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.arrayNumbers[0]);
    });

    test('Map Array has difference', () => {
        const after = generateTestData();
        after.arrayMap[0].test = 'test 2';
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #arrayMap[0].#test = :0');
        expect(result.ConditionExpression).toBe('#arrayMap[0].#test = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.arrayMap[0].test);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.arrayMap[0].test);
    });

    test('Map has difference', () => {
        const after = generateTestData();
        after.map.number = 2;
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #map.#number = :0');
        expect(result.ConditionExpression).toBe('#map.#number = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.map.number);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.map.number);
    });

    test('Map has two differences', () => {
        const after = generateTestData();
        after.map.number = 2;
        after.map.string = 'test 2';
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #map.#number = :0, #map.#string = :1');
        expect(result.ConditionExpression).toBe('#map.#number = :0Old AND #map.#string = :1Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.map.number);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.map.number);
        expect(result.ExpressionAttributeValues[':1']).toBe(after.map.string);
        expect(result.ExpressionAttributeValues[':1Old']).toBe(before.map.string);
    });

    test('Value type does not match', () => {
        const after = generateTestData();
        after.string = 2;
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #string = :0');
        expect(result.ConditionExpression).toBe('#string = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.string);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.string);
    });

    test('New value added', () => {
        const after = generateTestData();
        const before = generateTestData();
        delete before.number;
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('add #number = :0');
        expect(result.ConditionExpression).toBe('attribute_not_exists(#number)');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.number);
        expect(result.ExpressionAttributeValues[':0Old']).toBeUndefined();
    });

    test('New value deleted', () => {
        const after = generateTestData();
        delete after.number;
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('remove #number');
        expect(result.ConditionExpression).toBe('#number = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(undefined);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.number);
    });

    test('Map value added', () => {
        const after = generateTestData();
        const before = generateTestData();
        delete before.map;
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('add #map = :0');
        expect(result.ConditionExpression).toBe('attribute_not_exists(#map)');
        expect(result.ExpressionAttributeValues[':0']).toMatchObject(after.map);
        expect(result.ExpressionAttributeValues[':0Old']).toBeUndefined();
    });

    test('Map value deleted', () => {
        const after = generateTestData();
        delete after.map;
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('remove #map');
        expect(result.ConditionExpression).toBe('#map = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(undefined);
        expect(result.ExpressionAttributeValues[':0Old']).toMatchObject(before.map);
    });

    test('Array value added', () => {
        const after = generateTestData();
        after.arrayString.push('Test 3');
        const before = generateTestData();
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('add #arrayString[2] = :0');
        expect(result.ConditionExpression).toBe('attribute_not_exists(#arrayString[2])');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.arrayString[2]);
        expect(result.ExpressionAttributeValues[':0Old']).toBeUndefined();
        expect(result.ExpressionAttributeNames['#arrayString[2]']).toBeUndefined();
    });

    test('Array value deleted', () => {
        const after = generateTestData();
        const before = generateTestData();
        before.arrayString.push('Test 3');
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('remove #arrayString[2]');
        expect(result.ConditionExpression).toBe('#arrayString[2] = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(undefined);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.arrayString[2]);
    });

    test('Date not equal', () => {
        const after = generateTestData();
        const before = generateTestData();
        before.date = new Date(2020,1,1);
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #date = :0');
        expect(result.ConditionExpression).toBe('#date = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.date);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.date);
    });

    test('Date before is null', () => {
        const after = generateTestData();
        const before = generateTestData();
        before.date = null;
        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('add #date = :0');
        expect(result.ConditionExpression).toBe('#date = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(after.date);
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.date);
    });

    test('Data removes existing element', () => {
        const after = generateTestData();
        const before = generateTestData();
        before.val = [{test: 'test1'}, {test: 'test2', number: 2}];
        after.val = undefined;

        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('remove #val');
        expect(result.ConditionExpression).toBe('#val = :0Old');
        expect(result.ExpressionAttributeValues[':0']).toBeUndefined();
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.val);
    });

    test('Data changes and removes existing element', () => {
        const after = generateTestData();
        const before = generateTestData();
        before.val = [{test: 'test1'}, {test: 'test2', number: 2}];
        after.val = undefined;
        after.number = 2;

        const result = generateDeltaUpdate('test', { Key: 'test'}, before , after);
        expect(result.UpdateExpression).toBe('set #number = :0 remove #val');
        expect(result.ConditionExpression).toBe('#number = :0Old AND #val = :1Old');
        expect(result.ExpressionAttributeValues[':0']).toBe(2);
        expect(result.ExpressionAttributeValues[':1']).toBeUndefined();
        expect(result.ExpressionAttributeValues[':0Old']).toBe(before.number);
        expect(result.ExpressionAttributeValues[':1Old']).toBe(before.val);
    });
});

function generateTestData() : any {
    return {
        number: 1,
        string: 'This is a string',
        bool: true,
        buffer: new Buffer(''),
        arrayString: ['test', 'test 2'],
        arrayNumbers: [1, 2],
        arrayMap: [{test: 'test'}, {test1: 'test2'}],
        date: new Date(2019, 1, 1),
        map: {
            number: 1,
            string: 'This is a string',
            bool: true,
            buffer: new Buffer(''),
        },
        nullValue: null
    };
}
