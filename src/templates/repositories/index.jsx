import React, { useState, useEffect, useMemo } from "react";
import { graphql } from "gatsby";
import PropTypes from "prop-types";

import { RepositoryType } from "src/types";

import { ACTIONS, SECTIONS, REPOSITORY_COUNT_PER_PAGE } from "src/constants";

import { useNavigation } from "src/hooks/useNavigation";
import { useDebounce } from "src/hooks/useDebounce";

import Actions from "src/components/actions";
import Card from "src/components/card";
import Grid from "src/components/grid";
import Intro from "src/components/intro";
import Layout from "src/components/layout";
import SEO from "src/components/seo";
import Pagination from "src/components/pagination";
import SearchInput from "../../components/searchInput";

import "./index.scss";

const RepositoriesPage = ({ data, pageContext, location }) => {
  const { totalCount, repositories } = data?.repositoriesData;
  const { repositories: allRepositories } = data?.allRepositoriesData;
  const {
    siteMetadata: { platform },
  } = data?.site;
  const { currentPage, pageCount } = pageContext;

  const currentPath = location.pathname || "";
  const activeAction =
    Object.values(ACTIONS).find(
      action =>
        currentPath.includes(action.route) && action !== ACTIONS.TRENDING,
    ) || ACTIONS.TRENDING;

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchInput = useDebounce(searchInput, 500);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);

  const [filteredRepositories, setFilteredRepositories] = useState(
    repositories,
  );

  const [resetNavigation, disableNavigation] = useNavigation(
    SECTIONS.REPOSITORIES,
  );

  const isInitialLoad = useMemo(
    // If user has searched once, false
    // If repositories are different from default, false
    () => !hasSearched && filteredRepositories === repositories,
    [hasSearched, filteredRepositories, repositories],
  );

  useEffect(() => {
    if (debouncedSearchInput) {
      setFilteredRepositories(
        allRepositories.filter(repository =>
          repository.name.includes(debouncedSearchInput),
        ),
      );
      setHasSearched(true);
    } else if (!isInitialLoad) setFilteredRepositories(repositories);
  }, [isInitialLoad, debouncedSearchInput, allRepositories, repositories]);

  useEffect(() => {
    // reset navigation when filteredRepositories changes
    if (!isInitialLoad && !isSearchInputFocused) resetNavigation();
  }, [
    filteredRepositories,
    isInitialLoad,
    isSearchInputFocused,
    resetNavigation,
  ]);

  console.log(hasSearched);
  console.log(isInitialLoad);

  const startIndex = (currentPage - 1) * REPOSITORY_COUNT_PER_PAGE + 1;
  const endIndex =
    currentPage === totalCount
      ? totalCount
      : currentPage * REPOSITORY_COUNT_PER_PAGE;

  return (
    <Layout isHome>
      <SEO title={`${activeAction.label} ${platform} color schemes`} />
      <Intro />
      <div className="action-row">
        <SearchInput
          value={searchInput}
          onChange={event => setSearchInput(event.target.value)}
          onFocusChange={isFocused => {
            if (isFocused) {
              disableNavigation();
            } else if (!searchInput) {
              resetNavigation();
            }
            setIsSearchInputFocused(isFocused);
          }}
        />
        <Actions actions={Object.values(ACTIONS)} activeAction={activeAction} />
      </div>
      {!debouncedSearchInput && (
        <p>
          {startIndex}
          {" - "}
          {endIndex} out of <strong>{totalCount}</strong> repositories
        </p>
      )}
      <Grid className="repositories">
        {filteredRepositories.map(repository => (
          <Card
            key={`repository-${repository.owner.name}-${repository.name}`}
            linkState={{ fromPath: currentPath }}
            repository={repository}
          />
        ))}
      </Grid>
      {!debouncedSearchInput && (
        <Pagination
          currentPage={currentPage}
          pageCount={pageCount}
          activeActionRoute={activeAction.route}
        />
      )}
    </Layout>
  );
};

RepositoriesPage.propTypes = {
  data: PropTypes.shape({
    site: PropTypes.shape({
      siteMetadata: PropTypes.shape({
        platform: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    repositoriesData: PropTypes.shape({
      totalCount: PropTypes.number.isRequired,
      repositories: PropTypes.arrayOf(RepositoryType).isRequired,
    }).isRequired,
    allRepositoriesData: PropTypes.shape({
      repositories: PropTypes.arrayOf(RepositoryType).isRequired,
    }).isRequired,
  }).isRequired,
  pageContext: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    skip: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    pageCount: PropTypes.number.isRequired,
  }),
};

export const query = graphql`
  query(
    $skip: Int!
    $limit: Int!
    $sortField: [mongodbColorschemesRepositoriesFieldsEnum]!
    $sortOrder: [SortOrderEnum]!
  ) {
    site {
      siteMetadata {
        platform
      }
    }
    repositoriesData: allMongodbColorschemesRepositories(
      filter: { valid: { eq: true }, image_urls: { ne: "" } }
      sort: { fields: $sortField, order: $sortOrder }
      limit: $limit
      skip: $skip
    ) {
      totalCount
      repositories: nodes {
        name
        description
        stargazersCount: stargazers_count
        createdAt: github_created_at
        lastCommitAt: last_commit_at
        githubUrl: github_url
        weekStargazersCount: week_stargazers_count
        owner {
          name
        }
        featuredImage: processed_featured_image {
          childImageSharp {
            fluid {
              ...GatsbyImageSharpFluid
            }
          }
        }
        images: processed_images {
          childImageSharp {
            fluid {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    }
    allRepositoriesData: allMongodbColorschemesRepositories(
      filter: { valid: { eq: true }, image_urls: { ne: "" } }
      sort: { fields: $sortField, order: $sortOrder }
    ) {
      repositories: nodes {
        name
        description
        stargazersCount: stargazers_count
        createdAt: github_created_at
        lastCommitAt: last_commit_at
        githubUrl: github_url
        weekStargazersCount: week_stargazers_count
        owner {
          name
        }
        featuredImage: processed_featured_image {
          childImageSharp {
            fluid {
              ...GatsbyImageSharpFluid
            }
          }
        }
        images: processed_images {
          childImageSharp {
            fluid {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    }
  }
`;

export default RepositoriesPage;
