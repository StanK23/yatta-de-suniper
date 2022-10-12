import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

const paginationBtn =
  "inline-flex items-center rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";

const Pagination = () => {
  let router = useRouter();
  let currentPage = 0;
  if (router.query["page"] != undefined) {
    currentPage = parseInt(router.query["page"]! as string);
  }

  let previousLink = `?page=${currentPage <= 1 ? "1" : currentPage - 1}`;
  let nextLink = `?page=${currentPage + 1}`;

  return (
    <div className="flex flex-row justify-center">
      <Link href={previousLink}>
        <a className={paginationBtn}>Previous</a>
      </Link>

      <Link href={nextLink}>
        <a className={paginationBtn + " ml-1"}>Next</a>
      </Link>
    </div>
  );
};

export default Pagination;
