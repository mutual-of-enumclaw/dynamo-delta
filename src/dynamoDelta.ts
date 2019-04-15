import { DynamoDB } from "aws-sdk";

interface Update {
    path: string;
    beforeValue: any;
    afterValue: any;
}

export function generateDeltaTransaction<T>(tableName: string, key: any, before: T, after: T):
    DynamoDB.DocumentClient.TransactWriteItem {
    const update = generateDeltaUpdate(tableName, key, before, after);

    if(!update) {
         return null;
    }
    
    return {
        Update: update
    } as DynamoDB.DocumentClient.TransactWriteItem;
}

export function generateDeltaUpdate<T>(tableName: string, key: any, before: T, after: T): 
    DynamoDB.DocumentClient.UpdateItemInput {
    const updates = generateUpdates(before, after);

    let updateExpression = '';
    let conditionExpression = '';
    const expressionValues = {};
    const expressionNames = {};

    for(let i = 0; i < updates.length; i++) {
        const update = updates[i];
        if(i !== 0) {
            updateExpression += ', ';
            conditionExpression += ' AND ';
        }


        const path = `#${update.path.split('.').join('.#')}`;
        updateExpression += `${path} = :${i}`;
        expressionValues[':' + i] = update.afterValue;
        
        if(update.beforeValue !== undefined) {
            conditionExpression += `${path} = :${i}Old`;
            expressionValues[`:${i}Old`] = update.beforeValue;
        } else {
            conditionExpression += `attribute_not_exists(${path})`;
        }

        update.path.split('.').forEach(part => {
            expressionNames['#' + part] = part;
        });
    }

    if(updateExpression) {
        return {
            TableName: tableName,
            Key: key,
            UpdateExpression: 'set ' + updateExpression,
            ConditionExpression: conditionExpression,
            ExpressionAttributeValues: expressionValues,
            ExpressionAttributeNames: expressionNames
        } as DynamoDB.DocumentClient.UpdateItemInput;
    }
    return null;
}

function getFieldValues(object: any, fields: Array<any>) {
    for(const i in object) {
        if(!fields.find(value => { return value === i; })) {
            fields.push(i);
        }
    }
}

function generateUpdates<T>(before: T, after: T, path: string = '', isArray: boolean = false) : Array<Update> {
    const retval: Array<Update> = [];
    const fields: Array<any> = [];
    getFieldValues(after, fields);
    getFieldValues(before, fields);
    for(const i in fields) {
        const field = fields[i];
        const afterValue = after[field];
        const beforeValue = before[field];
        if(afterValue === null && beforeValue === null) {
            // Do nothing, they match
        } else if(afterValue === null || beforeValue === null) {
            let relativePath = ((path)? path + '.' + field : field);
            if(isArray) {
                relativePath = `${path}[${field}]`;
            }
            retval.push({ path: relativePath, beforeValue, afterValue });
        }
        else if(afterValue !== undefined && beforeValue !== undefined) {
            let relativePath = ((path)? path + '.' + field : field);
            if(isArray) {
                relativePath = `${path}[${field}]`;
            }

            switch(typeof afterValue) {
                case 'string':
                case 'boolean':
                case 'number':
                    if(afterValue !== beforeValue) {
                        retval.push({ path: relativePath, beforeValue, afterValue });
                    }
                    break;
                default:
                    if(Buffer.isBuffer(afterValue)) {
                        if(Buffer.compare(afterValue, beforeValue) !== 0) {
                            retval.push({ path: relativePath, beforeValue, afterValue });
                        }
                    }
                    else if(afterValue instanceof Date) {
                        const afterDateValue = (afterValue as Date).toISOString();
                        const beforeDateValue = (beforeValue instanceof Date)? beforeValue.toISOString() : beforeValue;
                        if(afterDateValue !== beforeDateValue) {
                            retval.push({path: relativePath, beforeValue, afterValue});
                        }
                    }
                    else if(Array.isArray(afterValue)) {
                        retval.push(...generateUpdates(beforeValue, afterValue, relativePath, true));
                    } else {
                        retval.push(...generateUpdates(beforeValue, afterValue, relativePath));
                    }
            }
        } else {
            let relativePath = ((path)? path + '.' + field : field);
            if(isArray) {
                relativePath = `${path}[${field}]`;
            }

            retval.push({ path: relativePath, afterValue, beforeValue });
        }
    }

    return retval;
}
