<?php
/**
 * Admin Controller
 *
 * PHP version 5
 *
 * Copyright (C) Moravian Library 2016.
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
 * @package  Controller
 * @author   Martin Kravec <martin.kravec@mzk.cz>
 * @license  http://opensource.org/licenses/gpl-3.0.php GNU General Public License
 */
namespace CPK\Controller;

use MZKCommon\Controller\ExceptionsTrait, CPK\Db\Row\User;
use VuFind\Exception\Auth as AuthException;
use Zend\Mvc\MvcEvent;
use CPK\Service\ConfigurationsHandler;
use CPK\Service\TranslationsHandler;
use Zend\View\Model\ViewModel;

/**
 * Class controls VuFind administration.
 *
 * @category VuFind2
 * @package Controller
 * @author Martin Kravec <martin.kravec@mzk.cz>, Jiří Kozlovský <mail@jkozlovsky.cz>
 * @license http://opensource.org/licenses/gpl-3.0.php GNU General Public License
 */
class AdminController extends \VuFind\Controller\AbstractBase
{
    use ExceptionsTrait;

    /**
     * Access manager instance
     *
     * @var AccessManager
     */
    protected $accessManager;

    /**
     * Initializes access manager & continues choosing an action as defined by parent
     *
     * {@inheritDoc}
     *
     * @see \Zend\Mvc\Controller\AbstractActionController::onDispatch()
     */
    public function onDispatch(MvcEvent $e)
    {
        $this->accessManager = new AccessManager($this->getAuthManager());

        return parent::onDispatch($e);
    }

    /**
     * Returns current instance of access manager
     *
     * @return \CPK\Controller\AccessManager
     */
    public function getAccessManager()
    {
        return $this->accessManager;
    }

    /**
     * Admin home.
     *
     * @return \Zend\View\Model\ViewModel
     */
    public function homeAction()
    {
        return $this->redirect()->toRoute('admin-configurations');
    }

    /**
     * Action for requesting tranlations changes
     *
     * @return mixed|\Zend\Http\Response|\Zend\View\Model\ViewModel
     */
    public function configurationsAction()
    {
        if (! $this->accessManager->isLoggedIn())
            return $this->forceLogin();

        $configHandler = new ConfigurationsHandler($this);

        $configHandler->handlePostRequestFromHome();

        return $this->createViewModel([
            'isPortalAdmin' => $this->accessManager->isPortalAdmin(),
            'ncipTemplate' => $configHandler->getNcipTemplate(),
            'alephTemplate' => $configHandler->getAlephTemplate(),
            'configs' => $configHandler->getAdminConfigs()
        ], 'admin/configurations/main.phtml');
    }

    /**
     * Action for approval of configuration change requests
     *
     * @return mixed|\Zend\Http\Response|\Zend\View\Model\ViewModel
     */
    public function configurationsApprovalAction()
    {
        if (! $this->accessManager->isLoggedIn())
            return $this->forceLogin();

            // Must be an portal admin ..
        $this->accessManager->assertIsPortalAdmin();

        $configHandler = new ConfigurationsHandler($this);

        $configHandler->handlePostRequestFromApproval();

        return $this->createViewModel([
            'isPortalAdmin' => $this->accessManager->isPortalAdmin(),
            'ncipTemplate' => $configHandler->getNcipTemplate(),
            'alephTemplate' => $configHandler->getAlephTemplate(),
            'configs' => $configHandler->getAllRequestConfigs()
        ], 'admin/configurations/approval.phtml');
    }

    /**
     * Action for requesting tranlations changes
     *
     * @return mixed|\Zend\Http\Response|\Zend\View\Model\ViewModel
     */
    public function translationsAction()
    {
        if (! $this->accessManager->isLoggedIn())
            return $this->forceLogin();

        $translationsHandler = new TranslationsHandler($this);

        $translationsHandler->handlePostRequestFromHome();

        return $this->createViewModel([
            'isPortalAdmin' => $this->accessManager->isPortalAdmin(),
            'sourcesBeingAdmin' => $this->accessManager->getInstitutionsWithAdminRights(),
            'translations' => $translationsHandler->getAdminTranslations(),
            'supportedLanguages' => $translationsHandler::SUPPORTED_TRANSLATIONS
        ], 'admin/translations/main.phtml');
    }

    /**
     * Action for approval of translations change requests
     *
     * @return mixed|\Zend\Http\Response|\Zend\View\Model\ViewModel
     */
    public function translationsApprovalAction()
    {
        if (! $this->accessManager->isLoggedIn())
            return $this->forceLogin();

            // Must be an portal admin ..
        $this->accessManager->assertIsPortalAdmin();

        $translationsHandler = new TranslationsHandler($this);

        $translationsHandler->handlePostRequestFromApproval();

        return $this->createViewModel([
            'isPortalAdmin' => $this->accessManager->isPortalAdmin(),
            'translations' => $translationsHandler->getAllTranslations(),
            'supportedLanguages' => $translationsHandler::SUPPORTED_TRANSLATIONS
        ],'admin/translations/approval.phtml');
    }

    public function portalPagesAction()
    {
        if (! $this->accessManager->isLoggedIn())
            return $this->forceLogin();

            // Must be an portal admin ..
        $this->accessManager->assertIsPortalAdmin();

        $user = $this->accessManager->getUser();

        $viewModel = $this->createViewModel();
        $viewModel->setVariable('isPortalAdmin', $this->accessManager->isPortalAdmin());
        $viewModel->setVariable('user', $user);

        $portalPagesTable = $this->getTable("portalpages");

        $positions = [
            'left',
            'middle-left',
            'middle-right',
            'right'
        ];
        $placements = [
            'footer',
            'advanced-search'
        ];

        $subAction = $this->params()->fromRoute('subaction');
        if ($subAction == 'Edit') { // is edit in route?
            $pageId = (int) $this->params()->fromRoute('param');
            $page = $portalPagesTable->getPageById($pageId);
            $viewModel->setVariable('page', $page);

            $viewModel->setVariable('positions', $positions);
            $viewModel->setVariable('placements', $placements);

            $viewModel->setTemplate('admin/edit-portal-page');
        } else
            if ($subAction == 'Save') {
                $post = $this->params()->fromPost();
                $portalPagesTable->save($post);
                return $this->forwardTo('Admin', 'PortalPages');
            } else
                if ($subAction == 'Insert') {
                    $post = $this->params()->fromPost();
                    $portalPagesTable->insertNewPage($post);
                    return $this->forwardTo('Admin', 'PortalPages');
                } else
                    if ($subAction == 'Delete') {
                        $pageId = $this->params()->fromRoute('param');
                        if (! empty($pageId)) {
                            $portalPagesTable->delete($pageId);
                        }
                        return $this->forwardTo('Admin', 'PortalPages');
                    } else
                        if ($subAction == 'Create') {
                            $viewModel->setVariable('positions', $positions);
                            $viewModel->setVariable('placements', $placements);
                            $viewModel->setTemplate('admin/create-portal-page');
                        } else { // normal view
                            $allPages = $portalPagesTable->getAllPages('*', false);
                            $viewModel->setVariable('pages', $allPages);
                        }

        $this->layout()->searchbox = false;
        return $viewModel;
    }

    /**
     * Permissions manager
     *
     * @return \Zend\View\Model\ViewModel
     */
    public function permissionsManagerAction()
    {
        if (! $this->accessManager->isLoggedIn())
            return $this->forceLogin();

            // Must be an portal admin ..
        $this->accessManager->assertIsPortalAdmin();

        $user = $this->accessManager->getUser();

        $viewModel = $this->createViewModel();
        $viewModel->setVariable('isPortalAdmin', $this->accessManager->isPortalAdmin());
        $viewModel->setVariable('user', $user);

        $userTable = $this->getTable('user');

        $subAction = $this->params()->fromRoute('subaction');
        if ($subAction == 'Save') {
            $post = $this->params()->fromPost();
            $userTable->saveUserWithPermissions($post['eppn'], $post['major']);
            return $this->forwardTo('Admin', 'PermissionsManager');
        } else
            if ($subAction == 'RemovePermissions') {
                $eppn = $this->params()->fromRoute('param');
                $major = NULL;
                $userTable->saveUserWithPermissions($eppn, $major);
                return $this->forwardTo('Admin', 'PermissionsManager');
            } else
                if ($subAction == 'AddUser') {
                    $viewModel->setTemplate('admin/add-user-with-permissions');
                } else
                    if ($subAction == 'EditUser') {
                        $eppn = $this->params()->fromRoute('param');
                        $major = $this->params()->fromRoute('param2');

                        $viewModel->setVariable('eppn', $eppn);
                        $viewModel->setVariable('major', $major);

                        $viewModel->setTemplate('admin/edit-user-with-permissions');
                    } else { // normal view
                        $usersWithPermissions = $userTable->getUsersWithPermissions();
                        $viewModel->setVariable('usersWithPermissions', $usersWithPermissions);
                        $viewModel->setTemplate('admin/permissions-manager');
                    }

        $this->layout()->searchbox = false;
        return $viewModel;
    }

    /**
     * Widgets manager
     *
     * @return \Zend\View\Model\ViewModel
     */
    public function widgetsAction()
    {
        if (! $this->accessManager->isLoggedIn())
            return $this->forceLogin();

            // Must be an portal admin ..
            $this->accessManager->assertIsPortalAdmin();

            $user = $this->accessManager->getUser();

            $widgets = [
                ['id' => '1', 'en_title' => 'News', 'cs_title' => 'Novinky'],
                ['id' => '2', 'en_title' => 'Most wanted', 'cs_title' => 'Nejpůjčovanější'],
                ['id' => '3', 'en_title' => 'Actions', 'cs_title' => 'Akce'],
                ['id' => '3', 'en_title' => 'Authors', 'cs_title' => 'Autoři']
            ];

            $viewModel = $this->createViewModel();
            $viewModel->setVariable('isPortalAdmin', $this->accessManager->isPortalAdmin());
            $viewModel->setVariable('user', $user);
            $viewModel->setVariable('widgets', $widgets);
            $viewModel->setTemplate('admin/widgets/list');

            $this->layout()->searchbox = false;
            return $viewModel;
    }

    /**
     * Overriden createViewModel which accepts template as the 2nd arg.
     *
     * {@inheritDoc}
     * @see \VuFind\Controller\AbstractBase::createViewModel()
     */
    protected function createViewModel(array $params = null, $template = null)
    {
        $vm = parent::createViewModel($params);

        if (isset($template))
            $vm->setTemplate($template);

        return $vm;
    }
}

/**
 * An Access Manager serving only to Admin Controller
 * in order to have full control over accessing pages
 * dedicated to adminitrators.
 *
 * @author Jiří Kozlovský <mail@jkozlovsky.cz>
 *
 */
class AccessManager
{

    /**
     * Source / identifier of main portal admin
     *
     * @var string
     */
    const PORTAL_ADMIN_SOURCE = 'cpk';

    /**
     * User
     *
     * @var \CPK\Db\Row\User
     */
    protected $user;

    /**
     * Holds names of institutions user is admin of
     *
     * @var array
     */
    protected $institutionsBeingAdminAt = [];

    /**
     * Auth Manager
     *
     * @var \CPK\Auth\Manager
     */
    protected $authManager;

    /**
     * Holds info about user being portal admin
     *
     * @var bool
     */
    protected $isPortalAdmin;

    /**
     * C'tor
     *
     * Throws AuthException only if logged in user is not admin
     * in any institution he has connected.
     *
     * @param \CPK\Auth\Manager $authManager
     *
     * @throws AuthException
     */
    public function __construct(\CPK\Auth\Manager $authManager)
    {
        $this->authManager = $authManager;

        $this->init();
    }

    /**
     * Initializes institutions where is logged in user admin and
     * throws an AuthException when user is not admin in any institution
     *
     * @throws AuthException
     */
    protected function init()
    {
        $this->user = $this->authManager->isLoggedIn();

        if (! $this->user) {
            $this->isPortalAdmin = false;
            return;
        }

        if (! empty($this->user->major)) {

            $sources = explode(',', $this->user->major);

            $this->institutionsBeingAdminAt = $sources;
        }

        $libCards = $this->user->getLibraryCards(true);
        foreach ($libCards as $libCard) {

            if (! empty($libCard->major)) {

                $sources = explode(',', $libCard->major);

                $this->institutionsBeingAdminAt = array_merge($this->institutionsBeingAdminAt, $sources);
            }
        }

        if (empty($this->institutionsBeingAdminAt)) {
            throw new AuthException('You\'re not an admin!');
        }

        // Trim all elements
        $this->institutionsBeingAdminAt = array_unique(array_map('trim', $this->institutionsBeingAdminAt));

        // Is portal admin ?
        $this->isPortalAdmin = false;
        foreach ($this->institutionsBeingAdminAt as $key => $adminSource) {
            if (strtolower($adminSource) === self::PORTAL_ADMIN_SOURCE) {

                $this->isPortalAdmin = true;
                unset($this->institutionsBeingAdminAt[$key]); // Do not break because it can be defined more than one way ..
            }
        }
    }

    /**
     * Returns bool whether current user is logged in
     *
     * @return boolean
     */
    public function isLoggedIn()
    {
        if (! $this->user)
            return false;

        return true;
    }

    /**
     * Returns current User
     *
     * @return \CPK\Db\Row\User
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * If current user is not portal admin, it throws an \VuFind\Exception\Auth
     *
     * @throws AuthException
     */
    public function assertIsPortalAdmin()
    {
        if ($this->isPortalAdmin() === false)
            throw new AuthException('You\'re not a portal admin!');
    }

    /**
     * Returns bool whether current user is an portal admin or is not
     *
     * @return boolean
     */
    public function isPortalAdmin()
    {
        return $this->isPortalAdmin;
    }

    /**
     * Returns array of institution sources where is current
     * logged in user an admin
     *
     * @return array
     */
    public function getInstitutionsWithAdminRights()
    {
        return $this->institutionsBeingAdminAt;
    }
}