<?php
namespace MZKPortal\Module\Configuration;

$config = array(
    'vufind' => array(
        'plugin_managers' => array (
            'recorddriver' => array (
                'factories' => array(
                    'solrdefault' => 'MZKPortal\RecordDriver\Factory::getSolrDefault',
                    'solrportal_muni'    => 'MZKPortal\RecordDriver\Factory::getSolrMarcMuni',
                    'solrportal_mzk'     => 'MZKPortal\RecordDriver\Factory::getSolrMarcMzk',
                    'solrportal_kjm'     => 'MZKPortal\RecordDriver\Factory::getSolrMarcKjm',
                    'solrportal_rajhrad'     => 'MZKPortal\RecordDriver\Factory::getSolrMarcKjm',
                    'solrvut'     => 'MZKPortal\RecordDriver\Factory::getSolrMarcVut',
                    'solrportal_mend'    => 'MZKPortal\RecordDriver\Factory::getSolrMarcMend',
                    'solrmerged'  => 'MZKPortal\RecordDriver\Factory::getSolrMarcMerged',
                ) /* factories */
            ), /* recorddriver */
            'recordtab' => array(
                'abstract_factories' => array('VuFind\RecordTab\PluginFactory'),
                'invokables' => array(
                    'libraries' => 'MZKPortal\RecordTab\Libraries',
                ),
            ), /* recordtab */
            'auth' => array(
                'factories' => array(
                    'shibbolethWithWAYF' => 'MZKPortal\Auth\Factory::getShibbolethWithWAYF',
                ),
            ),
            'search_params' => array(
                'factories' => array(
                    'solr' => 'MZKPortal\Search\Params\Factory::getSolrParams',
                 )
            ),
        ), /* plugin_managers */
        'recorddriver_tabs' => array(
            'MZKPortal\RecordDriver\SolrMarcMerged' => array(
                'tabs' => array (
                    'holdings' =>  'MZKPortal\RecordTab\HoldingsMerged',
                    'TOC' => 'TOC',
                    'UserComments' => 'UserComments',
                    'Details' => 'StaffViewArray',
                ),
            ),

            'MZKPortal\RecordDriver\SolrMarcMzk' => array(
                'tabs' => array (
                    'holdings'     => 'MZKPortal\RecordTab\Holdings996',
                    'UserComments' => 'UserComments',
                    'Details' => 'StaffViewMARC',
                ),
            ),

            'MZKPortal\RecordDriver\SolrMarcMuni' => array(
                'tabs' => array (
                    'holdings'     => 'MZKPortal\RecordTab\Holdings996',
                    'UserComments' => 'UserComments',
                    'Details' => 'StaffViewMARC',
                ),
            ),

            'MZKPortal\RecordDriver\SolrMarcMend' => array(
                'tabs' => array (
                    'holdings'     => 'MZKPortal\RecordTab\Holdings980',
                    'UserComments' => 'UserComments',
                    'Details' => 'StaffViewMARC',
                ),
            ),
                
            'MZKPortal\RecordDriver\SolrMarcKjm' => array(
                'tabs' => array (
                    'holdings'     => 'MZKPortal\RecordTab\Holdings993',
                    'UserComments' => 'UserComments',
                    'Details' => 'StaffViewMARC',
                ),
            )
        ) /* recorddriver_tabs */
    ), /* vufind */
    'controllers' => array(
        'invokables' => array(
            'my-research' => 'MZKPortal\Controller\MyResearchController',
        ),
    ),
    'service_manager' => array(
        'factories' => array(
            'VuFind\AuthManager' => 'MZKPortal\Auth\Factory::getAuthManager',
        ),
    ),
);

return $config;
