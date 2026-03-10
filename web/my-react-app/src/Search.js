import * as React from "react";
import { useState } from "react";

const Search = (props) => {
  const [text, setText] = useState("");
  const [addText, setAddText] = useState("");

  const apikey = props.apikey;
  const H = window.H;
  const platform = new H.service.Platform({
    apikey: apikey,
  });
  const service = platform.getSearchService();
  const onClickSearch = () => {
    service.geocode(
      {
        q: text,
        limit: 1,
      },
      (result) => {
        result.items.forEach((item) => {
          console.log(item.position);
          props.onGeocodeResult(item.position);
        });
      },
      alert
    );
    setText("");
  };

  return (
    <div>
      <input
        type="text"
        name="query"
        id="query"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search location"
      />
      <button onClick={onClickSearch}>Search</button>
    </div>
  );
};
export default Search;
