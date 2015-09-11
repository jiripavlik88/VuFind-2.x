<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Debug\Service;

use Locale;
use Traversable;
use Zend\Cache;
use Zend\Cache\Storage\StorageInterface as CacheStorage;
use Zend\EventManager\EventManager;
use Zend\EventManager\EventManagerInterface;
use Zend\I18n\Exception;
use Zend\I18n\Translator\Loader\FileLoaderInterface;
use Zend\I18n\Translator\Loader\RemoteLoaderInterface;
use Zend\Stdlib\ArrayUtils;

/**
 * Translator.
 */
class Translator extends \Zend\I18n\Translator\Translator
{

    /**
     * Translate a message.
     *
     * @param  string $message
     * @param  string $textDomain
     * @param  string $locale
     * @return string
     */
    public function translate($message, $textDomain = 'default', $locale = null)
    {
        $locale      = ($locale ?: $this->getLocale());

        if ($locale == "dg")
        {
            $translation = $this->getTranslatedMessage($message, $locale, $textDomain);
        }
        else
        {
            $translation = parent::getTranslatedMessage($message, $locale, $textDomain);
        }

        if ($translation !== null && $translation !== '') {
            return $translation;
        }

        if (null !== ($fallbackLocale = $this->getFallbackLocale())
        && $locale !== $fallbackLocale
        ) {
            return $this->translate($message, $textDomain, $fallbackLocale);
        }

        return $message;
    }


    /**
     * Get a translated message.
     *
     * @triggers getTranslatedMessage.missing-translation
     * @param    string $message
     * @param    string $locale
     * @param    string $textDomain
     * @return   string|null
     */
    protected function getTranslatedMessage(
        $message,
        $locale,
        $textDomain = 'default'
    ) {
        if ($message === '') {
            return '';
        }

        $callStack = debug_backtrace()[7];
        $fullpath = $callStack['file'];
        $pathParts = explode("themes", $fullpath);
        $shortPath = '';
        if (! empty($pathParts) && array_key_exists('1', $pathParts)) $shortPath = $pathParts[1];
        $lineNumber = $callStack['line'];
        return "" . $message . " (" . $shortPath . ")[" . $lineNumber . "]";
    }

    /**
     * @return I18nTranslatorInterface
     */
    public function getTranslator()
    {
        return $this;
    }

}
