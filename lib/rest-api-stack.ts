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
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReviews2",
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

      const newMovieReviewsFn = new lambdanode.NodejsFunction(this, "AddMovieReviewsFn", {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/addMovieReviews.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieReviewsTable.tableName,
          REGION: "eu-west-1",
        },
      });

      const getMovieReviewsByIdFn = new lambdanode.NodejsFunction(
        this,
        "GetMovieReviewsByIdFn",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getMovieReviewsById.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: movieReviewsTable.tableName,
            REGION: 'eu-west-1',
          },
        }
        );

        const getMovieReviewsByReviewNameFn = new lambdanode.NodejsFunction(
          this,
          "GetMovieReviewsByReviewNameFn",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/getMovieReviewsByReviewName.ts`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: movieReviewsTable.tableName,
              REGION: 'eu-west-1',
            },
          }
          );

          const getAllMovieReviewsByReviewNameFn = new lambdanode.NodejsFunction(
            this,
            "GetAllMovieReviewsByReviewNameFn",
            {
              architecture: lambda.Architecture.ARM_64,
              runtime: lambda.Runtime.NODEJS_16_X,
              entry: `${__dirname}/../lambdas/getAllMovieReviewsByReviewName.ts`,
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
    movieReviewsTable.grantReadData(getMovieReviewsByIdFn)
    movieReviewsTable.grantReadData(getMovieReviewsByReviewNameFn)
    movieReviewsTable.grantReadData(getAllMovieReviewsByReviewNameFn)
    movieReviewsTable.grantWriteData(newMovieReviewsFn)


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


const moviesResource = api.root.addResource("movies");
const movieReviewsEndpoint = moviesResource.addResource("reviews");

movieReviewsEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getAllMovieReviewsFn, { proxy: true })
);

movieReviewsEndpoint.addMethod(
  "POST",
  new apig.LambdaIntegration(newMovieReviewsFn, { proxy: true })
);

const movieIdResource = moviesResource.addResource("{movieId}");
const movieReviewsIdEndpoint = movieIdResource.addResource("reviews");

movieReviewsIdEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getMovieReviewsByIdFn, { proxy: true })
);


const allReviewsByReviewerNameResource = movieReviewsEndpoint.addResource("{reviewerName}");

allReviewsByReviewerNameResource.addMethod(
  "GET",
  new apig.LambdaIntegration(getAllMovieReviewsByReviewNameFn, { proxy: true })
);





      }
    }
    