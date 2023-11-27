import { MovieReview } from '../shared/types'

export const movieReviews: MovieReview[] = [
  {
    movieId: 1234,
    reviewerName: "Dean", 
    reviewDate: "22-01-2023",      
    content: "This movie was very enjoyable!",
    rating: 4,
  },
  {
    movieId: 1234,
    reviewerName: "Katie", 
    reviewDate: "28-01-2023",      
    content: "This movie was terrible!",
    rating: 1,
  },
  {
    movieId: 2345,
    reviewerName: "John", 
    reviewDate: "23-02-2023",     
    content: "This movie was not very enjoyable!", 
    rating: 2,
  },
  {
    movieId: 3456,
    reviewerName: "Mary",   
    reviewDate: "02-04-2023",       
    content: "This movie was okay.",
    rating: 3,
  }
];
