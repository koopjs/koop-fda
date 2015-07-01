# koop-fda

> A FDA Food Recall Enforcement provider for Koop 

## How it works
1. All the data is requested from the [Open FDA](https://open.fda.gov/) food recalls enforcement API in pages
2. States affected are parsed out of the distribution_pattern.
3. Geometries are added to match the states from step 2 and merged into a single shape covering the area of the recall
4. All results are converted into GeoJSON
5. GeoJSON is loaded into Postgres
6. [Koop](http://github.com/esri/koop) handles conversions to Esri Feature Services, KML, Shapefile, GeoJSON and CSV


## Usage

- To download the full dataset simply append your requested file type to the end of this URL: http://koop.dc.esri.com/FDA
  - Options are: `[csv, zip, kml, geojson]`
- If you wish to filter the data, append `?where=` followed by a [URI Encoded](http://www.w3schools.com/tags/ref_urlencode.asp) SQL string 
  - [See this](http://meyerweb.com/eric/tools/dencoder/) for an easy in browser encoder
  - The full list of available parameters is here: https://open.fda.gov/food/enforcement/

- Example: accessing a feature service
```
http://koop.dc.esri.com/FDA/FeatureServer/0
```
Note: the first time you run this it may kick off a very long process

- Example requesting GeoJSON of all the zucchini recalls ever: `product_description like '%zucchini%'`
```
http://koop.dc.esri.com/FDA.geojson?where=product_description%20like%20%27%25zucchini%25%27
```

- Example requesting a CSV of listeria cases in 2015: `reason_for_recall like '%listeria%' AND recall_initiation_date >= 20150101`
```
http://koop.dc.esri.com/FDA.csv?where=reason_for_recall%20like%20%27%25listeria%25%27%20AND%20recall_initiation_date%20%3E%3D%2020150101
```

- Example requesting a shapefile of all recalls of products originating in Texas: `state = TX`
  - Note: Make sure to capitalize the state or you will get no results
```
http://koop.dc.esri.com/FDA.zip?where=state%20%3D%20TX
```

