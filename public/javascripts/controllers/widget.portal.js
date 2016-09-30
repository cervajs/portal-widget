define([
    'controllers/widget.mixin',
    'jquery',
    'clipboard',
    'bootstrap'
  ], function (WidgetMixin, $, Clipboard) {

  var WidgetEditController = function ($scope, $http, $window, $controller) {
    // let's extend from the mixin first of all
    angular.extend(this, $controller(WidgetMixin, {$scope: $scope}));

    $scope.preview_webrtc_compatible = true;
    $scope.previewButton = true;
    $scope.previewDialpad = true;
    $scope.previewFullScreen = true;
    $scope.previewMute = false;
    $scope.widgetCode = 'Generating widget code...';
    $scope.tempButtonColor = "";
    $scope.tempFrameColor = "";
    $scope.selected_tag = 'div';

    $scope.master = {
      showWidgetCode: true,
      dial_pad: true,
      button_style: 'style-a',
      frame_color: '',
      background_style: 'dark',
      show_text_html_value: '<h3>This is a placeholder for your message</h3>',
      incompatible_browser_configuration: 'hide_widget',
      shouldProvision: false
    };

    $scope.prepareHtmlForCodepen = function (data) {
      return data.replace(/"/g, "'");
    };

    $scope.reset = function (form) {
      if (form) {
        form.$setPristine();
        form.$setUntouched();
      }

      $scope.widget = angular.copy($scope.master);
    };

    $scope.init = function () {
      $scope.wirePluginAndEvents();
    };

    $scope.loadWidgetData = function () {
      var data = $scope.initData;
      $scope.widget = angular.extend({}, $scope.widget, $scope.master, data.widget);
      $scope.widgetCode = data.widgetCode;
      $scope.widget.did = $scope.did = data.did;
      $scope.widget.link_button_to_a_page_value = $scope.widget.link_button_to_a_page;
      $scope.widget.show_text_html_value = $scope.widget.show_text_html;
    };

    // watch for initial widget data
    $scope.$watch('initData', $scope.loadWidgetData);

    $scope.isWebRTCSupported = function () {
      return voxbone.WebRTC.isWebRTCSupported();
    };

    $scope.showCallButton = function () {
      var ibc_value = $scope.widget.incompatible_browser_configuration;
      return $scope.preview_webrtc_compatible || (ibc_value === 'link_button_to_a_page');
    };

    $scope.getHiddenButtonText = function () {
      switch ($scope.widget.incompatible_browser_configuration) {
      case 'hide_widget':
        return "";
      case 'show_text_html':
        return $scope.widget.show_text_html_value;
      }
    };

    $scope.reset();
    $scope.init();

    $scope.setTheme = function (theme) {
      if($scope.widget.frame_color)
        $scope.tempFrameColor = $scope.widget.frame_color;
      if($scope.widget.button_color)
        $scope.tempButtonColor = $scope.widget.button_color;

      $scope.widget.frame_color = "";
      $scope.widget.button_color = "";
      if ($scope.widget.button_style != theme)
        $scope.widget.button_style = theme;
    };

    $scope.setCustomTheme = function() {
      $scope.tempFrameColor ? $scope.widget.frame_color = $scope.tempFrameColor : $scope.widget.frame_color = "black";
      $scope.widget.button_color = $scope.tempButtonColor;
    };

    $scope.generateWidgetCode = function () {
      console.log("--> Generating Output Code...");

      var callerId = $scope.widget.caller_id;
      if (callerId)
        callerId = callerId.replace(/[^a-zA-Z0-9-_]/g, '');

      var data = $scope.widget;
      data.callerId = callerId;
      data.selected_tag = $scope.selected_tag;

      var ibc = $scope.widget.incompatible_browser_configuration;
      if (ibc === 'hide_widget')
        data.hide_widget = true;
      else if (ibc === 'link_button_to_a_page')
        data.link_button_to_a_page = $scope.widget.link_button_to_a_page_value;
      else if (ibc === 'show_text_html')
        data.show_text_html = $scope.widget.show_text_html_value;

      var req = {
        method: 'POST',
        url: './portal-widget/get-code',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        data: data
      };

      $http(req)
        .then(function successCallback(response) {
            $scope.widgetCode = response.data.widget_code;
            $scope.widget_form.$setPristine();
          },
          function errorCallback(response) {
            var data = response.data;
            console.log("Error: ", data);

            $scope.widgetCode = 'Error generating widget code snippet. Please check it.';
          });
    };

    $scope.saveConfiguration = function(tag){
      $scope.selected_tag = tag;
      $scope.generateWidgetCode();
    }

    $scope.$watch('widget', function () {
      $scope.generateWidgetCode();
    }, true);
  };

  WidgetEditController.$inject = ['$scope', '$http', '$window', '$controller'];

  return WidgetEditController;
});
