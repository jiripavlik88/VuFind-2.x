<?php
/**
 * FavoriteFacets Recommendations Module
 *
 * PHP version 5
 *
 * Copyright (C) Villanova University 2010.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *
 * @category VuFind2
 * @package  Recommendations
 * @author   Demian Katz <demian.katz@villanova.edu>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org/wiki/vufind2:recommendation_modules Wiki
 */
namespace VuFind\Recommend;

/**
 * MapSelection Recommendations Module
 *
 * This class provides geospatial search
 *
 * @category VuFind2
 * @package  Recommendations
 * @author   Vaclav Rosecky <xrosecky@gmail.com>
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     http://vufind.org/wiki/vufind2:recommendation_modules Wiki
 */
class MapSelection implements RecommendInterface
{
    
    protected $defaultCoordinates = array(11.20, 48.30, 19.40, 51.30);
    
    protected $selectedCoordinates = null;
    
    protected $params = null;
    
    protected $searchObject = null;
    
    protected $facetField = 'bbox_geo';
    
    protected $height = 480;
    
    /**
     * setConfig
     *
     * Store the configuration of the recommendation module.
     *
     * @param string $settings Settings from searches.ini.
     *
     * @return void
     */
    public function setConfig($settings) {
        
    }
    
    /**
     * init
     *
     * Called at the end of the Search Params objects' initFromRequest() method.
     * This method is responsible for setting search parameters needed by the
     * recommendation module and for reading any existing search parameters that may
     * be needed.
     *
     * @param \VuFind\Search\Base\Params $params  Search parameter object
     * @param \Zend\StdLib\Parameters    $request Parameter object representing user
     * request.
     *
     * @return void
     */
    public function init($params, $request) {
    }
    
    /**
     * process
     *
     * Called after the Search Results object has performed its main search.  This
     * may be used to extract necessary information from the Search Results object
     * or to perform completely unrelated processing.
     *
     * @param \VuFind\Search\Base\Results $results Search results object
     *
     * @return void
     */
    public function process($results) {
        $filters = $results->getParams()->getFilters();
        $url = null;
        foreach ($filters as $key => $value) {
            if ($key == $this->facetField) {
                $match = array();
                if (preg_match( '/Intersects\(([0-9 \\-\\.]+)\)/', $value[0], $match)) {
                    $this->selectedCoordinates = explode(' ', $match[1]);
                }
                $url = (string) $results->getUrlQuery()->removeFacet($this->facetField, $value[0], false);
            }
        }
        if ($url == null) {
            $url = (string) $results->getUrlQuery()->getParams(false);
        }
        $url = substr($url, 1);
        $this->params = array();
        parse_str($url, $this->params);
    }
    
    public function getSelectedCoordinates() {
        return $this->selectedCoordinates;
    }
    
    public function getDefaultCoordinates() {
        return $this->defaultCoordinates;
    }
    
    public function getCoordinates() {
        $result = $this->getSelectedCoordinates();
        if ($result == null) {
            $result = $this->getDefaultCoordinates();
        }
        return $result;
    }
    
    public function getHeight() {
        return $this->height;
    }
    
    public function getParams() {
        return $this->params;
    }
    
}
