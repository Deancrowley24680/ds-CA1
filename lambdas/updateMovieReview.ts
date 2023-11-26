import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const movieId = event?.pathParameters?.movieId ? parseInt(event.pathParameters.movieId) : undefined;
  const reviewerName = event?.pathParameters?.reviewerName;
  const requestBody = event.body ? JSON.parse(event.body) : null;

  if (!movieId || isNaN(movieId) || !reviewerName || !requestBody || !requestBody.newReviewText) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required information" }),
    };
  }

  try {
    await ddbDocClient.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { movieId: movieId, reviewerName: reviewerName },
      UpdateExpression: "set content = :newText",
      ExpressionAttributeValues: {
        ":newText": requestBody.newReviewText,
      },
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Review updated successfully" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function createDDbDocClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
      wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
  }
