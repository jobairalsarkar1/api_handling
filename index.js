import axios from "axios";
import { writeToPath } from "fast-csv";

// step 1: fetching data from GRAPHQL API ENDPOINT
const fetchGraphQLData = async () => {
  try {
    // GraphQL endpoint and query
    const graphqlEndpoint = "https://countries.trevorblades.com/";
    const query = `
      query {
        countries {
          name
          capital
          currency
        }
      }
    `;

    // sending request to the api suing axios
    const response = await axios.post(graphqlEndpoint, { query });

    // parsed data and shows in the console
    const countries = response.data.data.countries;
    console.log("Fetched Countries Data:");
    console.log(JSON.stringify(countries, null, 2));

    return countries;
  } catch (error) {
    console.error("Error fetching GraphQL data:", error);
  }
};

// step 2: a
const postCountryDetails = async (country) => {
  try {
    const restApiEndpoint = "https://jsonplaceholder.typicode.com/posts";

    // format the data to post
    const postData = {
      title: `Country: ${country.name}`,
      body: `Capital: ${country.capital}, Currency: ${country.currency}`,
      userId: 1,
    };

    // sending post request to REST API using axios
    const response = await axios.post(restApiEndpoint, postData);
    console.log("Country Posted:", response.data);

    return response.data;
  } catch (error) {
    if (error.response) {
      // 403 error handling
      if (error.response.status === 403) {
        console.log("403 Forbidden: Skipping the request");
      } else if (error.response.status === 500) {
        // retry on 500 internal server srror with exponential backoff
        console.log("500 Internal Server Error: Retrying...");
        await exponentialBackoff(postCountryDetails, country);
      }
    } else {
      console.error("Error posting data to REST API:", error);
    }
  }
};

// exponential backoff function for retries
const exponentialBackoff = async (fn, country, retries = 5, delay = 1000) => {
  try {
    await fn(country);
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying in ${delay} ms...`);
      setTimeout(() => {
        exponentialBackoff(fn, country, retries - 1, delay * 2);
      }, delay);
    } else {
      console.error("Max retries reached, unable to post data.");
    }
  }
};

// step 3: save countries data to a CSV file
const saveToCSV = async (countries) => {
  try {
    const filePath = "countries.csv";

    // data for csv
    const csvData = countries.map((country) => ({
      Country_Name: country.name,
      Capital: country.capital,
      Currency: country.currency,
    }));

    // write to CSV using fast-csv
    writeToPath(filePath, csvData, { headers: true }).on("finish", () =>
      console.log("Data saved to countries.csv")
    );
  } catch (error) {
    console.error("Error saving data to CSV:", error);
  }
};

// step 4: automation and process handling
const automateWorkflow = async () => {
  try {
    // step 1: fetching data from GRAPHQL API ENDPOINT
    const countries = await fetchGraphQLData();

    // step 2: post country details to REST API
    const selectedCountry = countries[0]; // Example: selecting the first country

    // step save countries data to a CSV file
    const postResponse = await postCountryDetails(selectedCountry);

    // step 4: save all countries to CSV
    await saveToCSV(countries);
  } catch (error) {
    console.error("Error in automation process:", error);
  }
};

// run the whole process
automateWorkflow();
