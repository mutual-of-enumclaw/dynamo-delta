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

    let setExpression = '';
    let addExpression = '';
    let removeExpression = '';
    let conditionExpression = '';
    const expressionValues = {};
    const expressionNames = {};
    for(let i = 0; i < updates.length; i++) {
        const update = updates[i];
        const path = `#${update.path.split('.').join('.#')}`;

        
        if(update.afterValue === null || update.afterValue === undefined) {
            //
            // Add to remove expressions
            //
            if(removeExpression.length !== 0) {
                removeExpression += ', ';
            }

            removeExpression += path;
        } else if(!update.beforeValue && update.afterValue) {
            //
            // Add to set expressions
            //
            if(addExpression.length !== 0) {
                addExpression += ', ';
            }
    
            addExpression += `${path} = :${i}`;
            expressionValues[':' + i] = update.afterValue;
        } else {
            //
            // Add to set expressions
            //
            if(setExpression.length !== 0) {
                setExpression += ', ';
            }
    
            setExpression += `${path} = :${i}`;
            expressionValues[':' + i] = update.afterValue;
        }

        //
        // Condition
        //
        if(conditionExpression.length !== 0) {
            conditionExpression += ' AND ';
        }
        if(update.beforeValue !== undefined) {
            conditionExpression += `${path} = :${i}Old`;
            expressionValues[`:${i}Old`] = update.beforeValue;
        } else {
            conditionExpression += `attribute_not_exists(${path})`;
        }

        //
        // Add parts to expression name
        //
        update.path.split('.').forEach(part => {
            const arrayIndex = part.indexOf('[');
            const subPart = (arrayIndex < 0)? part : part.substr(0, arrayIndex);
            expressionNames['#' + subPart] = subPart;
        });
    }

    let updateExpression = '';
    if(setExpression.length > 0) {
        updateExpression = 'set ' + setExpression;
    }
    if(addExpression.length > 0) {
        if(updateExpression.length > 0) {
            updateExpression += ' ';
        }
        updateExpression = 'add ' + addExpression;
    }
    if(removeExpression.length > 0) {
        if(updateExpression.length > 0) {
            updateExpression += ' ';
        }

        updateExpression += 'remove ' + removeExpression;
    }

    if(updateExpression) {
        return {
            TableName: tableName,
            Key: key,
            UpdateExpression: updateExpression,
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
        let beforeValue = before[field];

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
                        if(beforeValue.length === 0 && afterValue.length === 0) {
                            // Do nothing
                        } else if(beforeValue.length === 0 && afterValue.length !== 0) {
                            retval.push({ path: relativePath, beforeValue, afterValue });
                        } else {
                            retval.push(...generateUpdates(beforeValue, afterValue, relativePath, true));
                        }
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
