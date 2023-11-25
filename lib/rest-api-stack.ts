import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateBatch } from "../shared/util";
import * as apig from "aws-cdk-lib/aws-apigateway";
import { movieReviews } from "../seed/movieReviews";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Tables 
    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews",
    });


    // Lambda Functions
    const getAllMovieReviewsFn = new lambdanode.NodejsFunction(
      this,
      "GetAllMovieReviewsFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getAllMovieReviews.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
      );


    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [movieReviewsTable.tableName]: generateBatch(movieReviews),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("movieReviewsddbInitData"), 
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [movieReviewsTable.tableArn],  
      }),
    });


    // Permissions 
    movieReviewsTable.grantReadData(getAllMovieReviewsFn)


    // REST API 
const api = new apig.RestApi(this, "RestAPI", {
  description: "Moview Reviews API",
  deployOptions: {
    stageName: "dev",
  },
  // 👇 enable CORS
  defaultCorsPreflightOptions: {
    allowHeaders: ["Content-Type", "X-Amz-Date"],
    allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
    allowCredentials: true,
    allowOrigins: ["*"],
  },
});

const moviesEndpoint = api.root.addResource("movie-reviews");
moviesEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getAllMovieReviewsFn, { proxy: true })
);


      }
    }
    